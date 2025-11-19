import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Reminder, TriggeredReminder, UserSettings } from "../types";
import { loadReminders, saveReminders, loadTriggeredReminders, saveTriggeredReminders, loadSettings, saveSettings } from "../utils/storage";
import { remindersAPI } from "../utils/api";
import { encrypt, loadKeys } from "../utils/encryption";
import { secureStorage } from "../utils/secureStorage";

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedReminders, loadedTriggered, loadedSettings] = await Promise.all([
        loadReminders(),
        loadTriggeredReminders(),
        loadSettings(),
      ]);
      setReminders(loadedReminders);
      setTriggeredReminders(loadedTriggered);
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "createdAt" | "status">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: "active",
    };

    // Save locally first (offline-first approach)
    const updated = [...reminders, newReminder];
    setReminders(updated);
    saveReminders(updated);

    // Sync with backend
    try {
      console.log("Starting backend sync...");

      const user = await secureStorage.getItem("user");
      if (!user) {
        console.log("No user found, skipping backend sync");
        return;
      }

      console.log("User found, loading encryption keys...");

      // Get encryption keys
      const keys = await loadKeys();
      if (!keys || !keys.publicKey) {
        console.log("No encryption keys found, skipping backend sync");
        return;
      }

      console.log("Encryption keys loaded, encrypting reminder data...");
      console.log("Task to encrypt:", reminder.task);
      console.log("Public key length:", keys.publicKey.length);

      // Encrypt sensitive data
      const encryptedTask = encrypt(reminder.task, keys.publicKey);
      console.log("Task encrypted successfully");

      // Encrypt all metadata as JSON in description
      const metadata = {
        trigger: reminder.trigger,
        recurrence: reminder.recurrence,
        assignee: reminder.assignee,
        locationName: reminder.locationName,
        dwellTime: reminder.dwellTime,
        weeklyDays: reminder.weeklyDays,
      };
      const metadataJson = JSON.stringify(metadata);
      console.log("Metadata to encrypt:", metadataJson);

      const encryptedDescription = encrypt(metadataJson, keys.publicKey);
      console.log("Metadata encrypted successfully");

      console.log("Sending to backend API...");

      // Send to backend
      const response = await remindersAPI.create({
        title: encryptedTask,
        description: encryptedDescription,
        location: {
          latitude: reminder.location.latitude,
          longitude: reminder.location.longitude,
        },
        radius: reminder.radius,
      });

      console.log("✅ Reminder synced to backend successfully:", response);
    } catch (error) {
      console.error("❌ Failed to sync reminder to backend:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      // Don't remove local reminder even if backend sync fails
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
