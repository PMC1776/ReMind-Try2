import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";

interface EditReminderModalProps {
  isOpen: boolean;
  initialTask: string;
  onClose: () => void;
  onSave: (newTask: string) => void;
}

export function EditReminderModal({
  isOpen,
  initialTask,
  onClose,
  onSave,
}: EditReminderModalProps) {
  const { colors } = useTheme();
  const [task, setTask] = useState(initialTask);

  useEffect(() => {
    if (isOpen) {
      setTask(initialTask);
    }
  }, [isOpen, initialTask]);

  const handleSave = () => {
    if (task.trim()) {
      onSave(task.trim());
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Dialog */}
        <View style={[styles.dialog, { backgroundColor: colors.backgroundRoot }]}>
          <Text style={[styles.title, { color: colors.text }]}>Edit Reminder</Text>

          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                backgroundColor: colors.backgroundDefault,
                borderColor: colors.border,
              },
            ]}
            value={task}
            onChangeText={setTask}
            placeholder="Update the task description"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            numberOfLines={3}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.backgroundDefault }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <Button
              title="Save"
              onPress={handleSave}
              disabled={!task.trim()}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  textInput: {
    width: "100%",
    minHeight: 100,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: "top",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
  },
});
