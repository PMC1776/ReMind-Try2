import React, { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { ReminderCard } from "../components/ReminderCard";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/Button";
import { EditReminderModal } from "../components/EditReminderModal";
import SuccessConfetti from "../components/SuccessConfetti";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { Spacing, BorderRadius } from "../constants/theme";
import { ReminderStatus } from "../types";

export default function ListViewScreen() {
  const { colors } = useTheme();
  const { reminders, updateReminder, archiveReminder, restoreReminder, batchArchive, batchRestore, batchDelete } = useReminders();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ReminderStatus>("active");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reminderToEdit, setReminderToEdit] = useState<{ id: string; task: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const filteredByStatus = reminders.filter((r) => r.status === viewMode);

  const filteredReminders = filteredByStatus.filter((reminder) => {
    const matchesSearch = reminder.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReminders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReminders.map(r => r.id));
    }
  };

  const handleReminderPress = async (id: string) => {
    if (selectionMode) {
      toggleSelection(id);
      return;
    }

    const isArchived = viewMode === "archived";

    if (isArchived) {
      // Archived reminders: Only show Restore option
      Alert.alert(
        "Archived Reminder",
        "This reminder is archived. Would you like to restore it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restore", onPress: () => handleRestore(id), style: "default" },
          { text: "Delete", onPress: () => handleDelete(id), style: "destructive" },
        ]
      );
    } else {
      // Active reminders: Show Edit, Archive, Delete options
      const reminder = reminders.find(r => r.id === id);
      Alert.alert(
        "Reminder Options",
        reminder?.task || "",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Edit", onPress: () => handleEdit(id), style: "default" },
          { text: "Archive", onPress: () => handleArchive(id), style: "default" },
          { text: "Delete", onPress: () => handleDelete(id), style: "destructive" },
        ]
      );
    }
  };

  const handleEdit = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    setReminderToEdit({ id, task: reminder.task });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (newTask: string) => {
    if (!reminderToEdit) return;

    try {
      await updateReminder(reminderToEdit.id, { task: newTask });
      Alert.alert("Success", "Reminder updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update reminder");
    } finally {
      setEditModalOpen(false);
      setReminderToEdit(null);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveReminder(id);
      Alert.alert("Success", "Reminder archived");
    } catch (error) {
      Alert.alert("Error", "Failed to archive reminder");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreReminder(id);
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to restore reminder");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to permanently delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await batchDelete([id]);
              Alert.alert("Success", "Reminder deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete reminder");
            }
          },
        },
      ]
    );
  };

  const handleBatchArchive = async () => {
    try {
      const count = await batchArchive(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      Alert.alert("Success", `${count} reminder${count === 1 ? '' : 's'} archived`);
    } catch (error) {
      Alert.alert("Error", "Failed to archive reminders");
    }
  };

  const handleBatchRestore = async () => {
    try {
      const count = await batchRestore(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to restore reminders");
    }
  };

  const handleBatchDelete = () => {
    Alert.alert(
      "Delete Reminders",
      `Are you sure you want to permanently delete ${selectedIds.length} reminder${selectedIds.length === 1 ? '' : 's'}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const count = await batchDelete(selectedIds);
              setSelectedIds([]);
              setSelectionMode(false);
              Alert.alert("Success", `${count} reminder${count === 1 ? '' : 's'} deleted`);
            } catch (error) {
              Alert.alert("Error", "Failed to delete reminders");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.background }}>
      {/* Header with View Mode Toggle and Selection Button */}
      <View style={styles.headerContainer}>
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === "active" ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            onPress={() => {
              setViewMode("active");
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <ThemedText
              style={[
                styles.viewModeText,
                {
                  color: viewMode === "active" ? colors.buttonText : colors.textPrimary,
                },
              ]}
            >
              Active
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === "archived" ? colors.primary : colors.surfaceSecondary,
              },
            ]}
            onPress={() => {
              setViewMode("archived");
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <ThemedText
              style={[
                styles.viewModeText,
                {
                  color: viewMode === "archived" ? colors.buttonText : colors.textPrimary,
                },
              ]}
            >
              Archived
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectionMode(!selectionMode);
            setSelectedIds([]);
          }}
          style={styles.selectButton}
        >
          <ThemedText style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
            {selectionMode ? "Cancel" : "Select"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
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

      {/* Select All in Selection Mode */}
      {selectionMode && filteredReminders.length > 0 && (
        <View style={styles.selectAllContainer}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Feather
              name={selectedIds.length === filteredReminders.length ? "check-square" : "square"}
              size={20}
              color={colors.primary}
            />
            <ThemedText style={styles.selectAllText}>
              {selectedIds.length === filteredReminders.length ? "Deselect All" : "Select All"}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={{ color: colors.tabIconDefault, fontSize: 14 }}>
            {selectedIds.length} selected
          </ThemedText>
        </View>
      )}

      {/* Reminders List */}
      <View style={styles.content}>
        {filteredReminders.length === 0 ? (
          <EmptyState
            image={require("../assets/illustrations/no-reminders.png")}
            title={searchQuery ? "No reminders found" : viewMode === "active" ? "No active reminders" : "No archived reminders"}
            subtitle={searchQuery ? "Try a different search term" : viewMode === "active" ? "Create a reminder to get started" : "Archived reminders will appear here"}
          />
        ) : (
          filteredReminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderRow}>
              {selectionMode && (
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleSelection(reminder.id)}
                >
                  <Feather
                    name={selectedIds.includes(reminder.id) ? "check-square" : "square"}
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <ReminderCard
                  task={reminder.task}
                  locationName={reminder.locationName}
                  trigger={reminder.trigger}
                  recurrence={reminder.recurrence}
                  onPress={() => handleReminderPress(reminder.id)}
                />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Batch Action Buttons */}
      {selectionMode && selectedIds.length > 0 && (
        <View style={[styles.batchActionsContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {viewMode === "active" && (
            <Button
              title={`Archive (${selectedIds.length})`}
              onPress={handleBatchArchive}
              style={styles.batchButton}
            />
          )}
          {viewMode === "archived" && (
            <Button
              title={`Restore (${selectedIds.length})`}
              onPress={handleBatchRestore}
              style={styles.batchButton}
            />
          )}
          <Button
            title={`Delete (${selectedIds.length})`}
            onPress={handleBatchDelete}
            style={[styles.batchButton, { backgroundColor: colors.danger }]}
          />
        </View>
      )}

      {/* Edit Modal */}
      <EditReminderModal
        isOpen={editModalOpen}
        initialTask={reminderToEdit?.task || ""}
        onClose={() => {
          setEditModalOpen(false);
          setReminderToEdit(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Success Confetti */}
      <SuccessConfetti
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        color="orange"
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  viewModeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
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
  selectAllContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100, // Extra padding for batch actions button
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  checkbox: {
    padding: 4,
  },
  batchActionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  batchButton: {
    flex: 1,
  },
});
