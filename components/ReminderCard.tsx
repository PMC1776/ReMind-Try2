import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { TriggerType, RecurrenceType } from "../types";
import * as Haptics from "expo-haptics";

interface ReminderCardProps {
  task: string;
  locationName: string;
  trigger: TriggerType;
  recurrence: RecurrenceType;
  onPress: () => void;
}

export function ReminderCard({
  task,
  locationName,
  trigger,
  recurrence,
  onPress,
}: ReminderCardProps) {
  const { colors } = useTheme();
  const triggerColor = trigger === "arriving" ? colors.primary : colors.orange;

  const getRecurrenceText = () => {
    if (recurrence.type === "once") return "Once";
    if (recurrence.type === "eachTime") return "Always";
    if (recurrence.type === "weekly" && recurrence.days) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const selectedDays = recurrence.days
        .map((isSelected, index) => (isSelected ? index : -1))
        .filter((index) => index !== -1);
      return selectedDays.map((d) => days[d]).join(", ");
    }
    if (recurrence.type === "specific_dates" && recurrence.dates) {
      return `${recurrence.dates.length} specific date${recurrence.dates.length !== 1 ? "s" : ""}`;
    }
    return "";
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.task}>{task}</ThemedText>
        <View
          style={[
            styles.badge,
            { backgroundColor: triggerColor + "20", borderColor: triggerColor },
          ]}
        >
          <ThemedText style={[styles.badgeText, { color: triggerColor }]}>
            {trigger === "arriving" ? "Arriving" : "Leaving"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.details}>
        <Feather name="map-pin" size={14} color={colors.tabIconDefault} />
        <ThemedText style={[styles.location, { color: colors.tabIconDefault }]}>
          {locationName}
        </ThemedText>
      </View>
      <ThemedText style={[styles.recurrence, { color: colors.tabIconDefault }]}>
        {getRecurrenceText()}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  task: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  recurrence: {
    fontSize: 14,
  },
});
