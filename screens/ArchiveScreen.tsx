import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { ReminderCard } from "../components/ReminderCard";
import { EmptyState } from "../components/EmptyState";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { Spacing } from "../constants/theme";

export default function ArchiveScreen() {
  const { colors } = useTheme();
  const { reminders } = useReminders();

  const archivedReminders = reminders.filter((r) => r.status === "archived");

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      {archivedReminders.length === 0 ? (
        <EmptyState
          image={require("../assets/illustrations/no-reminders.png")}
          title="No archived reminders"
          subtitle="Archived reminders will appear here"
        />
      ) : (
        <View style={styles.content}>
          {archivedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              task={reminder.task}
              locationName={reminder.locationName}
              trigger={reminder.trigger}
              recurrence={reminder.recurrence}
              weeklyDays={reminder.weeklyDays}
              onPress={() => {}}
            />
          ))}
        </View>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
});
