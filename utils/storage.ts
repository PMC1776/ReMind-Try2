import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reminder, TriggeredReminder, UserSettings } from "../types";

const REMINDERS_KEY = "reminders";
const TRIGGERED_KEY = "triggeredReminders";
const SETTINGS_KEY = "settings";

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export async function loadReminders(): Promise<Reminder[]> {
  const stored = await AsyncStorage.getItem(REMINDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveTriggeredReminders(triggered: TriggeredReminder[]): Promise<void> {
  await AsyncStorage.setItem(TRIGGERED_KEY, JSON.stringify(triggered));
}

export async function loadTriggeredReminders(): Promise<TriggeredReminder[]> {
  const stored = await AsyncStorage.getItem(TRIGGERED_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadSettings(): Promise<UserSettings> {
  const stored = await AsyncStorage.getItem(SETTINGS_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        defaultRadius: 200,
        accuracyMode: "balanced" as const,
        dwellTime: 0,
        notificationsEnabled: true,
      };
}
