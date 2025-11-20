import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useReminders } from "@/hooks/useReminders";
import { Button } from "@/components/Button";
import CustomLocationScreen from "@/screens/CustomLocationScreen";
import { CustomRecurrenceSheet } from "@/components/CustomRecurrenceSheet";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Coordinates } from "@/types";

interface AddReminderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (reminder: any) => void;
  existingReminder?: any;
  prefilledLocation?: { coordinates: Coordinates; name: string } | null;
}

type RecurrenceType =
  | { type: "once" }
  | { type: "eachTime" }
  | { type: "weekly"; days: boolean[]; timeStart?: string; timeEnd?: string; endDate?: string }
  | { type: "specific_dates"; dates: string[]; timeStart?: string; timeEnd?: string; endDate?: string };
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
          backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
        },
      ]}
    >
      <Text style={[styles.segmentedButtonText, { color: isActive ? colors.buttonText : colors.textPrimary }]}>{children}</Text>
    </TouchableOpacity>
  );
};

export default function AddReminderSheet({ isOpen, onClose, onSave, existingReminder, prefilledLocation }: AddReminderSheetProps) {
  const { colors } = useTheme();
  const { settings } = useReminders();
  const [task, setTask] = useState("");
  const [trigger, setTrigger] = useState<"arriving" | "leaving">("arriving");
  const [recurrence, setRecurrence] = useState<RecurrenceType>({ type: "once" });
  const [assignees, setAssignees] = useState<string[]>(["Me"]);
  const [locationType, setLocationType] = useState<LocationType>("current");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [customLocation, setCustomLocation] = useState<{ name: string; coordinates: Coordinates } | null>(null);
  const [showCustomLocationModal, setShowCustomLocationModal] = useState(false);
  const [showCustomRecurrenceModal, setShowCustomRecurrenceModal] = useState(false);

  // Mock users for the "Who?" section
  const users = [
    { id: "Me", initials: "me" },
    { id: "JD", initials: "JD" },
    { id: "JS", initials: "JS" },
  ];

  // Pre-fill form when editing existing reminder
  useEffect(() => {
    if (isOpen && existingReminder) {
      setTask(existingReminder.task || "");
      setTrigger(existingReminder.trigger || "arriving");
      setRecurrence(existingReminder.recurrence || { type: "once" });
      setAssignees(existingReminder.assignees || ["Me"]);

      // Set custom location from existing reminder
      if (existingReminder.location && existingReminder.locationName) {
        setCustomLocation({
          name: existingReminder.locationName,
          coordinates: existingReminder.location,
        });
        setLocationType("custom");
      }
    } else if (isOpen && prefilledLocation) {
      // Pre-fill location from map tap
      setCustomLocation(prefilledLocation);
      setLocationType("custom");
    } else if (isOpen) {
      // Reset form for new reminder
      setTask("");
      setTrigger("arriving");
      setRecurrence({ type: "once" });
      setAssignees(["Me"]);
      setLocationType("current");
      setCustomLocation(null);
      getCurrentLocation();
    }
  }, [isOpen, existingReminder, prefilledLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required to create reminders.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not get your current location. Please try again.");
    }
  };

  const handleCustomLocationSelect = (location: { name: string; coordinates: Coordinates }) => {
    setCustomLocation(location);
    setLocationType("custom");
    setShowCustomLocationModal(false);
  };

  const handleSave = async () => {
    if (!task.trim()) {
      return;
    }

    // Determine which location to use
    let finalLocation: Coordinates;
    let locationName: string;

    if (locationType === "custom" && customLocation) {
      finalLocation = customLocation.coordinates;
      locationName = customLocation.name;
    } else {
      if (!currentLocation) {
        Alert.alert("Location required", "Please wait while we get your location.");
        return;
      }
      finalLocation = currentLocation;

      // Get location name from coordinates
      locationName = "Current Location";
      try {
        const [address] = await Location.reverseGeocodeAsync(currentLocation);
        if (address) {
          locationName = address.name || address.street || `${address.city}, ${address.region}` || "Current Location";
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    }

    const reminderData = {
      task,
      trigger,
      recurrence,
      assignees,
      location: finalLocation,
      locationName,
      radius: settings.defaultRadius || 200,
      dwellTime: settings.dwellTime || 0,
    };

    console.log("Saving reminder:", reminderData);
    onSave?.(reminderData);

    // Reset form
    setTask("");
    setTrigger("arriving");
    setRecurrence({ type: "once" });
    setAssignees(["Me"]);
    setLocationType("current");
    setCustomLocation(null);
    onClose();
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {existingReminder ? "Edit Reminder" : "New Reminder"}
            </Text>
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
                        setAssignees((prev) => {
                          if (prev.includes(user.id)) {
                            // Remove if already selected (but keep at least one)
                            return prev.length > 1 ? prev.filter((id) => id !== user.id) : prev;
                          } else {
                            // Add to selection
                            return [...prev, user.id];
                          }
                        });
                      }}
                      style={[
                        styles.assigneeButton,
                        {
                          backgroundColor: assignees.includes(user.id)
                            ? colors.primary
                            : colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <Text style={[styles.assigneeText, { color: assignees.includes(user.id) ? colors.buttonText : colors.textPrimary }]}>{user.initials}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.addAssigneeButton, { borderColor: colors.border }]}
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
                <View style={styles.whereContainer}>
                  <View style={styles.buttonGroup}>
                    <SegmentedButton
                      isActive={locationType === "current"}
                      onPress={() => setLocationType("current")}
                    >
                      Current Location
                    </SegmentedButton>
                    <SegmentedButton
                      isActive={locationType === "custom"}
                      onPress={() => setShowCustomLocationModal(true)}
                    >
                      Custom
                    </SegmentedButton>
                  </View>
                  {locationType === "custom" && customLocation && (
                    <View style={styles.selectedLocationContainer}>
                      <Feather name="map-pin" size={16} color={colors.primary} />
                      <Text style={[styles.selectedLocationText, { color: colors.text }]} numberOfLines={2}>
                        {customLocation.name}
                      </Text>
                    </View>
                  )}
                </View>
              </FormRow>

              {/* How Often? */}
              <FormRow label="How Often?" showBorder={false}>
                <View style={styles.buttonGroup}>
                  <SegmentedButton
                    isActive={recurrence.type === "once"}
                    onPress={() => setRecurrence({ type: "once" })}
                  >
                    Once
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence.type === "eachTime"}
                    onPress={() => setRecurrence({ type: "eachTime" })}
                  >
                    Always
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence.type === "weekly" || recurrence.type === "specific_dates"}
                    onPress={() => setShowCustomRecurrenceModal(true)}
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
              title={existingReminder ? "Update Reminder" : "Set Reminder"}
              onPress={handleSave}
              disabled={!task.trim()}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>

      {/* Custom Location Modal */}
      <CustomLocationScreen
        isOpen={showCustomLocationModal}
        onClose={() => setShowCustomLocationModal(false)}
        onSelect={handleCustomLocationSelect}
      />

      {/* Custom Recurrence Modal */}
      <CustomRecurrenceSheet
        isOpen={showCustomRecurrenceModal}
        onClose={() => setShowCustomRecurrenceModal(false)}
        recurrence={recurrence}
        setRecurrence={setRecurrence}
      />
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
  whereContainer: {
    gap: 12,
  },
  selectedLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  selectedLocationText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  submitButton: {
    width: "100%",
  },
});
