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

        for (const backendReminder of backendReminders) {
          try {
            console.log(`Decrypting reminder ${backendReminder.id}...`);
            console.log(`  - title type: ${typeof backendReminder.title}`);
            console.log(`  - description type: ${typeof backendReminder.description}`);

            // Skip reminders with null/undefined encrypted fields
            if (!backendReminder.title || !backendReminder.description) {
              console.log(`⚠️ Skipping reminder ${backendReminder.id} - missing encrypted data`);
              continue;
            }

            // Decrypt task (stored in title field)
            const task = decrypt(backendReminder.title, keys.privateKey);

            // Decrypt metadata (stored in description field)
            const metadataJson = decrypt(backendReminder.description, keys.privateKey);
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
            console.log(`✅ Successfully decrypted reminder ${backendReminder.id}: "${task}"`);
          } catch (error) {
            console.error(`❌ Failed to decrypt reminder ${backendReminder.id}:`, error);
            if (error instanceof Error) {
              console.error("Decrypt error details:", error.message);
            }
            // Skip this reminder but continue with others
          }
        }

        if (decryptedReminders.length > 0) {
          console.log(`Successfully decrypted ${decryptedReminders.length} reminders`);
          setReminders(decryptedReminders);
          saveReminders(decryptedReminders);
        }
      } else {
        console.log("No reminders found on backend");
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

      console.log("🔵 Sending to backend API...");

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

    // Save original state for rollback
    const originalReminders = [...reminders];

    // Update locally first
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: "archived" as const, archivedAt } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      await remindersAPI.archive(id);
      console.log("Reminder archived on backend");
    } catch (error) {
      console.error("Failed to archive reminder on backend:", error);
      // Revert local change if backend fails
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
  };

  const restoreReminder = async (id: string) => {
    console.log("Restoring reminder:", id);

    // Save original state for rollback
    const originalReminders = [...reminders];

    // Update locally first - set archivedAt to null for proper filtering
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: "active" as const, archivedAt: undefined } : r
    );

    console.log("Updated reminders:", updated);
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      await remindersAPI.restore(id);
      console.log("✅ Reminder restored on backend successfully");
    } catch (error) {
      console.error("❌ Failed to restore reminder on backend:", error);
      // Revert local change if backend fails
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
  };

  const batchArchive = async (ids: string[]): Promise<number> => {
    const archivedAt = Math.floor(Date.now() / 1000);
    const originalReminders = [...reminders];

    // Update locally first
    const updated = reminders.map((r) =>
      ids.includes(r.id) ? { ...r, status: "archived" as const, archivedAt } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      const response = await remindersAPI.batchArchive(ids);
      console.log(`${response.count} reminders archived on backend`);
      return response.count;
    } catch (error) {
      console.error("Failed to batch archive reminders on backend:", error);
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
  };

  const batchRestore = async (ids: string[]): Promise<number> => {
    const originalReminders = [...reminders];

    // Update locally first
    const updated = reminders.map((r) =>
      ids.includes(r.id) ? { ...r, status: "active" as const, archivedAt: undefined } : r
    );
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      const response = await remindersAPI.batchRestore(ids);
      console.log(`${response.count} reminders restored on backend`);
      return response.count;
    } catch (error) {
      console.error("Failed to batch restore reminders on backend:", error);
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
  };

  const batchDelete = async (ids: string[]): Promise<number> => {
    const originalReminders = [...reminders];

    // Update locally first
    const updated = reminders.filter((r) => !ids.includes(r.id));
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      const response = await remindersAPI.batchDelete(ids);
      console.log(`${response.count} reminders deleted on backend`);
      return response.count;
    } catch (error) {
      console.error("Failed to batch delete reminders on backend:", error);
      setReminders(originalReminders);
      saveReminders(originalReminders);
      throw error;
    }
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
