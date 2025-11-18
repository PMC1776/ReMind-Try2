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
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  archiveReminder: (id: string) => void;
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

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setReminders(updated);
    saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const archiveReminder = (id: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: "archived" as const, archivedAt: new Date().toISOString() } : r
    );
    setReminders(updated);
    saveReminders(updated);
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
