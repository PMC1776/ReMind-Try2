import React, { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "../components/ThemedText";
import { ReminderCard } from "../components/ReminderCard";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/Button";
import { EditReminderModal } from "../components/EditReminderModal";
import { ReminderOptionsModal } from "../components/ReminderOptionsModal";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
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
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<{ id: string; task: string; locationName: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiColor, setConfettiColor] = useState<"primary" | "orange" | "coral">("coral");

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

    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    setSelectedReminder({
      id: reminder.id,
      task: reminder.task,
      locationName: reminder.locationName,
    });
    setOptionsModalOpen(true);
  };

  const handleReminderLongPress = (id: string) => {
    // Enter selection mode and select this item
    setSelectionMode(true);
    setSelectedIds([id]);
  };


  const handleEdit = () => {
    if (!selectedReminder) return;

    setReminderToEdit({ id: selectedReminder.id, task: selectedReminder.task });
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

  const handleArchive = async () => {
    if (!selectedReminder) return;

    try {
      await archiveReminder(selectedReminder.id);
      setConfettiColor("coral");
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to archive reminder");
    }
  };

  const handleRestore = async () => {
    if (!selectedReminder) return;

    try {
      await restoreReminder(selectedReminder.id);
      setConfettiColor("coral");
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to restore reminder");
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedReminder) return;

    try {
      await batchDelete([selectedReminder.id]);
      setConfettiColor("coral");
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to delete reminder");
    }
  };

  const handleBatchArchive = async () => {
    try {
      const count = await batchArchive(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      setConfettiColor("coral");
      setShowConfetti(true);
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
    setBatchDeleteConfirmOpen(true);
  };

  const confirmBatchDelete = async () => {
    try {
      const count = await batchDelete(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      setConfettiColor("coral");
      setShowConfetti(true);
    } catch (error) {
      Alert.alert("Error", "Failed to delete reminders");
    }
  };

  return (
    <>
    <ScreenScrollView style={{ backgroundColor: colors.background }}>
      {/* Mode Toggle Slider at Top */}
      <View style={styles.topContainer}>
        <View style={styles.modeToggleSlider}>
          <TouchableOpacity
            style={[
              styles.sliderButton,
              viewMode === "active" && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode("active");
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <ThemedText
              style={[
                styles.sliderButtonText,
                { color: viewMode === "active" ? colors.buttonText : colors.text },
              ]}
            >
              Active
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sliderButton,
              viewMode === "archived" && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode("archived");
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <ThemedText
              style={[
                styles.sliderButtonText,
                { color: viewMode === "archived" ? colors.buttonText : colors.text },
              ]}
            >
              Archived
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
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

      {/* Selection Mode Header */}
      {selectionMode && (
        <View style={[styles.selectionHeader, { borderBottomColor: colors.border }]}>
          {filteredReminders.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleSelectAll();
              }}
              style={styles.selectAllButton}
            >
              <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>
                {selectedIds.length === filteredReminders.length ? "Deselect All" : "Select All"}
              </ThemedText>
            </TouchableOpacity>
          )}
          <ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            {selectedIds.length} selected
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectionMode(false);
              setSelectedIds([]);
            }}
            style={styles.cancelButton}
          >
            <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
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
                  onLongPress={() => handleReminderLongPress(reminder.id)}
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

      {/* Options Modal */}
      <ReminderOptionsModal
        isOpen={optionsModalOpen}
        onClose={() => {
          setOptionsModalOpen(false);
          setSelectedReminder(null);
        }}
        title={selectedReminder?.task || "Reminder Options"}
        subtitle={selectedReminder?.locationName}
        isArchived={viewMode === "archived"}
        onEdit={viewMode === "active" ? handleEdit : undefined}
        onArchive={viewMode === "active" ? handleArchive : undefined}
        onRestore={viewMode === "archived" ? handleRestore : undefined}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Batch Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={batchDeleteConfirmOpen}
        onClose={() => setBatchDeleteConfirmOpen(false)}
        onConfirm={confirmBatchDelete}
        title="Delete Reminders"
        message={`Are you sure you want to permanently delete ${selectedIds.length} reminder${selectedIds.length === 1 ? '' : 's'}?`}
      />
    </ScreenScrollView>

    {/* Success Confetti - outside scroll view so it's fixed to viewport */}
    <SuccessConfetti
      show={showConfetti}
      onComplete={() => setShowConfetti(false)}
      color={confettiColor}
    />
    </>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    marginTop: -30, // Move both sections up by 30px
  },
  modeToggleSlider: {
    flexDirection: "row",
    padding: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  selectAllButton: {
    paddingVertical: 4,
  },
  cancelButton: {
    paddingVertical: 4,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100, // Extra padding for batch actions buttons
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 0,
  },
  checkbox: {
    padding: 4,
  },
  batchActionsContainer: {
    position: "absolute",
    bottom: 80, // Position above bottom navigation
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
