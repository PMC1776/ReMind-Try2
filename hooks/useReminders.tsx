import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Reminder, TriggeredReminder, UserSettings } from "../types";
import { loadReminders, saveReminders, loadTriggeredReminders, saveTriggeredReminders, loadSettings, saveSettings } from "../utils/storage";
import { remindersAPI } from "../utils/api";
import { encrypt, decrypt, loadKeys } from "../utils/encryption";
import { secureStorage } from "../utils/secureStorage";
import { ensureEncryptionKeys } from "../utils/ensureEncryptionKeys";

type RemindersContextType = {
  reminders: Reminder[];
  triggeredReminders: TriggeredReminder[];
  settings: UserSettings;
  addReminder: (reminder: Omit<Reminder, "id" | "createdAt" | "status">) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => void;
  archiveReminder: (id: string) => Promise<void>;
  restoreReminder: (id: string) => Promise<void>;
  batchArchive: (ids: string[]) => Promise<number>;
  batchRestore: (ids: string[]) => Promise<number>;
  batchDelete: (ids: string[]) => Promise<number>;
  dismissTriggered: (id: string) => void;
  clearAllTriggered: () => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  loading: boolean;
};

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [triggeredReminders, setTriggeredReminders] = useState<TriggeredReminder[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultRadius: 200,
    accuracyMode: "balanced",
    dwellTime: 0,
    notificationsEnabled: true,
    distanceUnit: "miles",
    timeFormat: "12h",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Ensure encryption keys exist before doing anything
      await ensureEncryptionKeys();

      // Load from local storage first (fast)
      const [loadedReminders, loadedTriggered, loadedSettings] = await Promise.all([
        loadReminders(),
        loadTriggeredReminders(),
        loadSettings(),
      ]);
      setReminders(loadedReminders);
      setTriggeredReminders(loadedTriggered);
      setSettings(loadedSettings);

      // Then sync with backend (in background)
      syncFromBackend();
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromBackend = async () => {
    try {
      const user = await secureStorage.getItem("user");
      if (!user) {
        console.log("No user found, skipping backend sync");
        return;
      }

      console.log("Syncing reminders from backend...");

      // Get encryption keys for decryption
      const keys = await loadKeys();
      if (!keys || !keys.privateKey) {
        console.log("No encryption keys found, cannot decrypt reminders");
        return;
      }

      // Fetch all reminders (active and archived)
      const [activeData, archivedData] = await Promise.all([
        remindersAPI.getAll("active"),
        remindersAPI.getAll("archived"),
      ]);

      // Backend returns array directly, not wrapped in .reminders
      const backendReminders = [...(Array.isArray(activeData) ? activeData : []), ...(Array.isArray(archivedData) ? archivedData : [])];

      if (backendReminders.length > 0) {
        console.log(`Found ${backendReminders.length} reminders on backend`);
        console.log("First backend reminder sample:", JSON.stringify(backendReminders[0], null, 2));

        // Decrypt and reconstruct reminders
        const decryptedReminders: Reminder[] = [];
        const failedReminderIds: string[] = [];

        for (const backendReminder of backendReminders) {
          try {
            // Skip reminders with null/undefined encrypted fields
            if (!backendReminder.title || !backendReminder.description) {
              console.log(`⚠️ Skipping reminder ${backendReminder.id} - missing encrypted data`);
              continue;
            }

            // Check if encrypted fields are strings
            if (typeof backendReminder.title !== 'string' || typeof backendReminder.description !== 'string') {
              console.log(`⚠️ Skipping reminder ${backendReminder.id} - encrypted data is not a string (title: ${typeof backendReminder.title}, description: ${typeof backendReminder.description})`);
              continue;
            }

            // Decrypt task (stored in title field)
            const task = decrypt(backendReminder.title, keys.privateKey);

            // Skip corrupted reminders with 0-byte content (encrypted with old bug)
            if (!task || task.length === 0) {
              console.log(`⚠️ Skipping reminder ${backendReminder.id} - corrupted/empty encrypted data`);
              continue;
            }

            // Decrypt metadata (stored in description field)
            const metadataJson = decrypt(backendReminder.description, keys.privateKey);

            // Skip if description is also empty
            if (!metadataJson || metadataJson.length === 0) {
              console.log(`⚠️ Skipping reminder ${backendReminder.id} - corrupted/empty metadata`);
              continue;
            }
            const metadata = JSON.parse(metadataJson);

            // Reconstruct the reminder object
            const reminder: Reminder = {
              id: backendReminder.id.toString(), // Convert backend integer ID to string
              task,
              trigger: metadata.trigger || "arriving",
              recurrence: metadata.recurrence || { type: "once" },
              location: backendReminder.location,
              locationName: metadata.locationName || "Unknown",
              radius: backendReminder.radius,
              dwellTime: metadata.dwellTime,
              assignees: metadata.assignees || ["Me"],
              status: backendReminder.status,
              createdAt: backendReminder.created_at || backendReminder.createdAt,
              archivedAt: backendReminder.archived_at || backendReminder.archivedAt,
            };

            decryptedReminders.push(reminder);
          } catch (error) {
            console.log(`⚠️ Skipping corrupted reminder ${backendReminder.id} - will be deleted`);
            // Add to failed list for cleanup
            failedReminderIds.push(backendReminder.id.toString());
          }
        }

        // Clean up failed reminders from backend
        if (failedReminderIds.length > 0) {
          console.log(`🧹 Deleting ${failedReminderIds.length} corrupted reminders from backend...`);
          try {
            await remindersAPI.batchDelete(failedReminderIds);
            console.log(`✅ Successfully deleted ${failedReminderIds.length} corrupted reminders`);
          } catch (error) {
            console.warn('⚠️ Failed to delete corrupted reminders from backend:', error);
          }
        }

        // Merge backend reminders with local-only reminders
        // Local-only reminders have timestamp IDs (13+ digits), backend IDs are small integers
        const currentLocalOnly = reminders.filter(r => parseInt(r.id) >= 1000000000000);

        // Merge: backend reminders + local-only reminders
        const mergedReminders = [...decryptedReminders, ...currentLocalOnly];

        if (mergedReminders.length > 0) {
          console.log(`Synced ${decryptedReminders.length} backend + ${currentLocalOnly.length} local-only = ${mergedReminders.length} total reminders`);
          setReminders(mergedReminders);
          saveReminders(mergedReminders);
        }
      } else {
        console.log("No reminders found on backend, keeping local reminders");
      }
    } catch (error) {
      console.error("Failed to sync from backend:", error);
      // Don't throw - keep using local data if backend sync fails
    }
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "createdAt" | "status">) => {
    try {
      console.log("🔵 Starting addReminder...");
      const user = await secureStorage.getItem("user");
      if (!user) {
        console.log("No user found, skipping backend sync");
        // Create local-only reminder if offline
        const tempId = Date.now().toString();
        const newReminder: Reminder = {
          ...reminder,
          id: tempId,
          createdAt: new Date().toISOString(),
          status: "active",
        };
        const updated = [...reminders, newReminder];
        setReminders(updated);
        saveReminders(updated);
        return;
      }

      console.log("🔵 User found, getting encryption keys...");
      // Get encryption keys
      const keys = await loadKeys();
      if (!keys || !keys.publicKey) {
        console.log("No encryption keys found, creating local reminder");
        const tempId = Date.now().toString();
        const newReminder: Reminder = {
          ...reminder,
          id: tempId,
          createdAt: new Date().toISOString(),
          status: "active",
        };
        const updated = [...reminders, newReminder];
        setReminders(updated);
        saveReminders(updated);
        return;
      }

      console.log("🔵 Encrypting reminder data...");

      // Encrypt sensitive data
      const encryptedTask = encrypt(reminder.task, keys.publicKey);

      // Encrypt all metadata as JSON in description
      const metadata = {
        trigger: reminder.trigger,
        recurrence: reminder.recurrence,
        assignees: reminder.assignees,
        locationName: reminder.locationName,
        dwellTime: reminder.dwellTime,
        weeklyDays: reminder.weeklyDays,
      };
      const encryptedDescription = encrypt(JSON.stringify(metadata), keys.publicKey);

      // Send to backend FIRST to get the real ID
      const backendReminder = await remindersAPI.create({
        title: encryptedTask,
        description: encryptedDescription,
        location: {
          latitude: reminder.location.latitude,
          longitude: reminder.location.longitude,
        },
        radius: reminder.radius,
      });

      console.log("✅ Backend response:", JSON.stringify(backendReminder, null, 2));
      console.log("✅ Backend ID:", backendReminder.id);
      console.log("✅ Backend ID type:", typeof backendReminder.id);

      // NOW save locally with the backend ID
      const newReminder: Reminder = {
        ...reminder,
        id: backendReminder.id.toString(),
        createdAt: backendReminder.created_at || backendReminder.createdAt || new Date().toISOString(),
        status: "active",
      };

      console.log("🔵 Saving locally with ID:", newReminder.id);
      const updated = [...reminders, newReminder];
      setReminders(updated);
      saveReminders(updated);
      console.log("✅ Local reminder saved with backend ID:", backendReminder.id);
    } catch (error) {
      console.error("❌ Failed to create reminder on backend:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      console.log("⚠️ Falling back to local-only reminder with temp ID");
      // Fallback: save locally with temp ID if backend fails
      const tempId = Date.now().toString();
      const newReminder: Reminder = {
        ...reminder,
        id: tempId,
        createdAt: new Date().toISOString(),
        status: "active",
      };
      const updated = [...reminders, newReminder];
      setReminders(updated);
      saveReminders(updated);
      console.log("⚠️ Saved locally with temp ID:", tempId);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const originalReminders = [...reminders];

    // Update locally first
    const updated = reminders.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend if task or other encrypted fields changed
    try {
      // For now, only sync if task is updated
      if (updates.task) {
        const keys = await loadKeys();
        if (keys && keys.publicKey) {
          const encryptedTask = encrypt(updates.task, keys.publicKey);
          await remindersAPI.update(id, { title: encryptedTask });
          console.log("Reminder updated on backend");
        }
      } else {
        // For non-encrypted fields, sync directly
        await remindersAPI.update(id, updates);
        console.log("Reminder updated on backend");
      }
    } catch (error) {
      console.error("Failed to update reminder on backend:", error);
      // Revert local change if backend fails
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const archiveReminder = async (id: string) => {
    // Unix timestamp in SECONDS
    const archivedAt = Math.floor(Date.now() / 1000);

    // Update locally first
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: "archived" as const, archivedAt } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend only if it's a backend ID (not a local timestamp ID)
    // Backend IDs are small integers, local IDs are large timestamps
    const numId = parseInt(id);
    const isBackendId = numId < 1000000000000; // Backend IDs are small, timestamps are 13 digits

    if (isBackendId) {
      try {
        console.log(`📤 Calling backend archive for ID: ${id}`);
        const response = await remindersAPI.archive(id);
        console.log("✅ Reminder archived on backend:", {
          id: response.id,
          status: response.status,
          archived_at: response.archived_at,
        });
      } catch (error: any) {
        console.error("⚠️ Backend archive failed:", {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          id,
        });
        // Don't revert - local change is kept even if backend fails
      }
    } else {
      console.log("Skipping backend archive for local-only reminder");
    }
  };

  const restoreReminder = async (id: string) => {
    console.log("📥 Restoring reminder:", id);

    // Check current state of the reminder
    const currentReminder = reminders.find(r => r.id === id);
    if (currentReminder) {
      console.log("Current reminder state:", {
        id: currentReminder.id,
        status: currentReminder.status,
        archivedAt: currentReminder.archivedAt,
        task: currentReminder.task.substring(0, 50),
      });
    } else {
      console.warn("⚠️ Reminder not found in local state!");
    }

    // Update locally first - set archivedAt to null for proper filtering
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: "active" as const, archivedAt: undefined } : r
    );

    setReminders(updated);
    saveReminders(updated);

    // Sync with backend only if it's a backend ID
    const numId = parseInt(id);
    const isBackendId = numId < 1000000000000;

    if (isBackendId) {
      try {
        console.log(`📤 Calling backend restore for ID: ${id}`);
        const response = await remindersAPI.restore(id);
        console.log("✅ Reminder restored on backend:", {
          id: response.id,
          status: response.status,
          archived_at: response.archived_at,
        });
      } catch (error: any) {
        console.error("❌ Backend restore failed:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
          id,
        });
        // Don't revert - local change is kept even if backend fails
      }
    } else {
      console.log("Skipping backend restore for local-only reminder");
    }
  };

  const batchArchive = async (ids: string[]): Promise<number> => {
    const archivedAt = Math.floor(Date.now() / 1000);

    // Update locally first
    const updated = reminders.map((r) =>
      ids.includes(r.id) ? { ...r, status: "archived" as const, archivedAt } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Filter to only backend IDs (not local timestamp IDs)
    const backendIds = ids.filter(id => parseInt(id) < 1000000000000);

    if (backendIds.length === 0) {
      console.log("All reminders are local-only, skipping backend sync");
      return ids.length;
    }

    // Sync with backend
    try {
      const response = await remindersAPI.batchArchive(backendIds);
      console.log(`${response.count} reminders archived on backend`);
    } catch (error) {
      console.error("⚠️ Backend batch archive failed, keeping local changes:", error);
      // Don't revert - local changes are kept even if backend fails
    }

    return ids.length; // Return total count including local ones
  };

  const batchRestore = async (ids: string[]): Promise<number> => {
    // Update locally first
    const updated = reminders.map((r) =>
      ids.includes(r.id) ? { ...r, status: "active" as const, archivedAt: undefined } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Filter to only backend IDs (not local timestamp IDs)
    const backendIds = ids.filter(id => parseInt(id) < 1000000000000);

    if (backendIds.length === 0) {
      console.log("All reminders are local-only, skipping backend sync");
      return ids.length;
    }

    // Sync with backend
    try {
      const response = await remindersAPI.batchRestore(backendIds);
      console.log(`${response.count} reminders restored on backend`);
    } catch (error) {
      console.error("⚠️ Backend batch restore failed, keeping local changes:", error);
      // Don't revert - local changes are kept even if backend fails
    }

    return ids.length; // Return total count including local ones
  };

  const batchDelete = async (ids: string[]): Promise<number> => {
    // Update locally first
    const updated = reminders.filter((r) => !ids.includes(r.id));
    setReminders(updated);
    saveReminders(updated);

    // Filter to only backend IDs (not local timestamp IDs)
    const backendIds = ids.filter(id => parseInt(id) < 1000000000000);

    if (backendIds.length === 0) {
      console.log("All reminders are local-only, skipping backend sync");
      return ids.length;
    }

    // Sync with backend
    try {
      const response = await remindersAPI.batchDelete(backendIds);
      console.log(`${response.count} reminders deleted on backend`);
    } catch (error) {
      console.error("⚠️ Backend batch delete failed, keeping local changes:", error);
      // Don't revert - local changes are kept even if backend fails
    }

    return ids.length; // Return total count including local ones
  };

  const dismissTriggered = (id: string) => {
    const updated = triggeredReminders.filter((t) => t.id !== id);
    setTriggeredReminders(updated);
    saveTriggeredReminders(updated);
  };

  const clearAllTriggered = () => {
    setTriggeredReminders([]);
    saveTriggeredReminders([]);
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    saveSettings(updated);
  };

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        triggeredReminders,
        settings,
        addReminder,
        updateReminder,
        deleteReminder,
        archiveReminder,
        restoreReminder,
        batchArchive,
        batchRestore,
        batchDelete,
        dismissTriggered,
        clearAllTriggered,
        updateSettings,
        loading,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error("useReminders must be used within a RemindersProvider");
  }
  return context;
}
