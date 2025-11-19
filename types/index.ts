export type TriggerType = "arriving" | "leaving";
export type RecurrenceType = "once" | "eachTime" | "weekly";
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
  weeklyDays?: number[];
  location: Coordinates;
  locationName: string;
  radius: number;
  dwellTime?: number;
  assignee?: string;
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
}
