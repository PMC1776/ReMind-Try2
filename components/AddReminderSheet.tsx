import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface AddReminderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (reminder: any) => void;
}

type RecurrenceType = "once" | "every_time" | "custom";
type LocationType = "current" | "custom";

// FormRow component for consistent layout
const FormRow = ({
  label,
  children,
  showBorder = true,
}: {
  label: string;
  children: React.ReactNode;
  showBorder?: boolean;
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.formRow,
        {
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.tabIconDefault }]}>{label}</Text>
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

// SegmentedButton component for option selection
const SegmentedButton = ({
  onPress,
  isActive,
  children,
}: {
  onPress: () => void;
  isActive: boolean;
  children: string;
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.segmentedButton,
        {
          backgroundColor: isActive ? colors.primary : "#8B9AA3",
        },
      ]}
    >
      <Text style={styles.segmentedButtonText}>{children}</Text>
    </TouchableOpacity>
  );
};

export default function AddReminderSheet({ isOpen, onClose, onSave }: AddReminderSheetProps) {
  const { colors } = useTheme();
  const [task, setTask] = useState("");
  const [trigger, setTrigger] = useState<"arriving" | "leaving">("arriving");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("once");
  const [assignees, setAssignees] = useState<string[]>(["Me"]);
  const [location, setLocation] = useState<LocationType>("current");

  // Mock users for the "Who?" section
  const users = [
    { id: "Me", initials: "me" },
    { id: "JD", initials: "JD" },
    { id: "JS", initials: "JS" },
  ];

  const toggleAssignee = (userId: string) => {
    setAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = () => {
    if (task.trim()) {
      console.log("Saving reminder:", { task, trigger, recurrence, assignees, location });
      onSave?.({ task, trigger, recurrence, assignees, location });
      // Reset form
      setTask("");
      setTrigger("arriving");
      setRecurrence("once");
      setAssignees(["Me"]);
      setLocation("current");
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.backgroundRoot }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>New Reminder</Text>
          </View>

          {/* Form */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              {/* Who? */}
              <FormRow label="Who?">
                <View style={styles.assigneesContainer}>
                  {users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleAssignee(user.id);
                      }}
                      style={[
                        styles.assigneeButton,
                        {
                          backgroundColor: assignees.includes(user.id)
                            ? colors.primary
                            : "#8B9AA3",
                        },
                      ]}
                    >
                      <Text style={styles.assigneeText}>{user.initials}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.addAssigneeButton, { borderColor: "#8B9AA3" }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      console.log("Add new contact");
                    }}
                  >
                    <Feather name="plus" size={20} color={colors.tabIconDefault} />
                  </TouchableOpacity>
                </View>
              </FormRow>

              {/* What? */}
              <FormRow label="What?">
                <TextInput
                  value={task}
                  onChangeText={setTask}
                  placeholder="e.g., 'Try the caramel latte' or 'Pick up groceries'"
                  placeholderTextColor={colors.tabIconDefault}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      backgroundColor: "transparent",
                    },
                  ]}
                />
              </FormRow>

              {/* When? */}
              <FormRow label="When?">
                <View style={styles.buttonGroup}>
                  <SegmentedButton
                    isActive={trigger === "arriving"}
                    onPress={() => setTrigger("arriving")}
                  >
                    Arriving
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={trigger === "leaving"}
                    onPress={() => setTrigger("leaving")}
                  >
                    Leaving
                  </SegmentedButton>
                </View>
              </FormRow>

              {/* Where? */}
              <FormRow label="Where?">
                <View style={styles.buttonGroup}>
                  <SegmentedButton
                    isActive={location === "current"}
                    onPress={() => setLocation("current")}
                  >
                    Current Location
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={location === "custom"}
                    onPress={() => setLocation("custom")}
                  >
                    Custom
                  </SegmentedButton>
                </View>
              </FormRow>

              {/* How Often? */}
              <FormRow label="How Often?" showBorder={false}>
                <View style={styles.buttonGroup}>
                  <SegmentedButton
                    isActive={recurrence === "once"}
                    onPress={() => setRecurrence("once")}
                  >
                    Once
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence === "every_time"}
                    onPress={() => setRecurrence("every_time")}
                  >
                    Always
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence === "custom"}
                    onPress={() => setRecurrence("custom")}
                  >
                    Custom
                  </SegmentedButton>
                </View>
              </FormRow>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Set Reminder"
              onPress={handleSave}
              disabled={!task.trim()}
              style={styles.submitButton}
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
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    width: "100%",
    maxWidth: 512,
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  formContainer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 12,
  },
  labelContainer: {
    width: 64,
    flexShrink: 0,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  assigneesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assigneeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  addAssigneeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  textInput: {
    width: "100%",
    minHeight: 80,
    padding: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  segmentedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  segmentedButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  submitButton: {
    width: "100%",
  },
});
