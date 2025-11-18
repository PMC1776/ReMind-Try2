import React, { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { ReminderCard } from "../components/ReminderCard";
import { FilterChip } from "../components/FilterChip";
import { EmptyState } from "../components/EmptyState";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { Spacing, BorderRadius } from "../constants/theme";
import { TriggerType } from "../types";

export default function ListViewScreen() {
  const { colors } = useTheme();
  const { reminders } = useReminders();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TriggerType>("all");

  const activeReminders = reminders.filter((r) => r.status === "active");

  const filteredReminders = activeReminders.filter((reminder) => {
    const matchesSearch = reminder.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || reminder.trigger === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleReminderPress = (id: string) => {
    Alert.alert(
      "Reminder Options",
      "What would you like to do with this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", onPress: () => {}, style: "default" },
        { text: "Delete", onPress: () => {}, style: "destructive" },
      ]
    );
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundDefault }]}>
          <Feather name="search" size={20} color={colors.tabIconDefault} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search reminders..."
            placeholderTextColor={colors.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <FilterChip
          label="All"
          selected={filterType === "all"}
          onPress={() => setFilterType("all")}
        />
        <FilterChip
          label="Arriving"
          selected={filterType === "arriving"}
          onPress={() => setFilterType("arriving")}
        />
        <FilterChip
          label="Leaving"
          selected={filterType === "leaving"}
          onPress={() => setFilterType("leaving")}
        />
      </ScrollView>

      <View style={styles.content}>
        {filteredReminders.length === 0 ? (
          <EmptyState
            image={require("../assets/illustrations/no-reminders.png")}
            title={searchQuery ? "No reminders found" : "No active reminders"}
            subtitle={searchQuery ? "Try a different search term" : "Create a reminder to get started"}
          />
        ) : (
          filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              task={reminder.task}
              locationName={reminder.locationName}
              trigger={reminder.trigger}
              recurrence={reminder.recurrence}
              weeklyDays={reminder.weeklyDays}
              onPress={() => handleReminderPress(reminder.id)}
            />
          ))
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
});
