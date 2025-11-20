export type TriggerType = "arriving" | "leaving";
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
