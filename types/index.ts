export type TriggerType = "arriving" | "leaving" | "never";
export type RecurrenceType =
  | { type: "once" }
  | { type: "eachTime" }
  | { type: "weekly"; days: boolean[]; timeStart?: string; timeEnd?: string; endDate?: string }
  | { type: "specific_dates"; dates: string[]; timeStart?: string; timeEnd?: string; endDate?: string };
export type ReminderStatus = "active" | "archived";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Reminder {
  id: string;
  task: string;
  trigger: TriggerType;
  recurrence: RecurrenceType;
  location: Coordinates;
  locationName: string;
  radius: number;
  dwellTime?: number;
  assignees?: string[];
  status: ReminderStatus;
  createdAt: string;
  archivedAt?: number; // Unix timestamp in SECONDS (not milliseconds)
}

export interface TriggeredReminder {
  id: string;
  reminderId: string;
  task: string;
  locationName: string;
  trigger: TriggerType;
  triggeredAt: string;
}

export interface UserSettings {
  defaultRadius: number;
  accuracyMode: "high" | "balanced" | "battery";
  dwellTime: number;
  notificationsEnabled: boolean;
  distanceUnit: "miles" | "km";
  timeFormat: "12h" | "24h";
}

export interface LocationPreset {
  id: string;
  userId: string;
  name: string; // Decrypted on client
  coordinates: Coordinates;
  address: string | null; // Decrypted on client
  icon: string | null;
  createdAt: number; // Unix timestamp in seconds
}

export interface EncryptedLocationPreset {
  id: string;
  userId: string;
  name: string; // Encrypted JSON string
  coordinates: Coordinates;
  address: string | null; // Encrypted JSON string or null
  icon: string | null;
  createdAt: number;
}

export interface CreateLocationPresetInput {
  name: string;
  coordinates: Coordinates;
  address?: string | null;
  icon?: string | null;
}

export interface UpdateLocationPresetInput {
  name?: string;
  coordinates?: Coordinates;
  address?: string | null;
  icon?: string | null;
}
