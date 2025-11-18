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
  weeklyDays?: number[];
  onPress: () => void;
}

export function ReminderCard({
  task,
  locationName,
  trigger,
  recurrence,
  weeklyDays,
  onPress,
}: ReminderCardProps) {
  const { colors } = useTheme();
  const triggerColor = trigger === "arriving" ? colors.primary : colors.orange;

  const getRecurrenceText = () => {
    if (recurrence === "once") return "Once";
    if (recurrence === "eachTime") return "Each time";
    if (recurrence === "weekly" && weeklyDays) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return weeklyDays.map((d) => days[d]).join(", ");
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
          backgroundColor: colors.backgroundDefault,
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
    borderRadius: BorderRadius.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
