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
import { useLocationPresets } from "@/hooks/useLocationPresets";
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
type LocationType = "current" | "custom" | "saved";

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
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
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
  style,
}: {
  onPress: () => void;
  isActive: boolean;
  children: string;
  style?: any;
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
        style,
      ]}
    >
      <Text
        style={[styles.segmentedButtonText, { color: isActive ? colors.buttonText : colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default function AddReminderSheet({ isOpen, onClose, onSave, existingReminder, prefilledLocation }: AddReminderSheetProps) {
  const { colors } = useTheme();
  const { settings } = useReminders();
  const { presets } = useLocationPresets();
  const [task, setTask] = useState("");
  const [trigger, setTrigger] = useState<"arriving" | "leaving" | "never">("arriving");
  const [recurrence, setRecurrence] = useState<RecurrenceType>({ type: "once" });
  const [assignees, setAssignees] = useState<string[]>(["Me"]);
  const [locationType, setLocationType] = useState<LocationType>("current");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [customLocation, setCustomLocation] = useState<{ name: string; coordinates: Coordinates } | null>(null);
  const [showCustomLocationModal, setShowCustomLocationModal] = useState(false);
  const [showSavedLocationsModal, setShowSavedLocationsModal] = useState(false);
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

  const handleSavedLocationSelect = (location: { name: string; coordinates: Coordinates }) => {
    setCustomLocation(location);
    setLocationType("saved");
    setShowSavedLocationsModal(false);
  };

  const handleSave = async () => {
    if (!task.trim()) {
      return;
    }

    // Determine which location to use
    let finalLocation: Coordinates;
    let locationName: string;

    if ((locationType === "custom" || locationType === "saved") && customLocation) {
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
              {/* Top Divider */}
              <View style={[styles.topDivider, { backgroundColor: colors.border }]}/>
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
                    style={{ flex: 1 }}
                  >
                    Arriving
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={trigger === "leaving"}
                    onPress={() => setTrigger("leaving")}
                    style={{ flex: 1 }}
                  >
                    Leaving
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={trigger === "never"}
                    onPress={() => setTrigger("never")}
                    style={{ flex: 1 }}
                  >
                    Never
                  </SegmentedButton>
                </View>
              </FormRow>

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

              {/* Where? */}
              <FormRow label="Where?">
                <View style={styles.whereContainer}>
                  <View style={styles.buttonGroup}>
                    <SegmentedButton
                      isActive={locationType === "current"}
                      onPress={() => setLocationType("current")}
                      style={{ flex: 1 }}
                    >
                      Current
                    </SegmentedButton>
                    <SegmentedButton
                      isActive={locationType === "saved"}
                      onPress={() => setShowSavedLocationsModal(true)}
                      style={{ flex: 1 }}
                    >
                      Saved
                    </SegmentedButton>
                    <SegmentedButton
                      isActive={locationType === "custom"}
                      onPress={() => setShowCustomLocationModal(true)}
                      style={{ flex: 1 }}
                    >
                      Custom
                    </SegmentedButton>
                  </View>
                  {(locationType === "custom" || locationType === "saved") && customLocation && (
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
              <FormRow label="Repeat?" showBorder={true}>
                <View style={styles.buttonGroup}>
                  <SegmentedButton
                    isActive={recurrence.type === "once"}
                    onPress={() => setRecurrence({ type: "once" })}
                    style={{ flex: 1 }}
                  >
                    Once
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence.type === "eachTime"}
                    onPress={() => setRecurrence({ type: "eachTime" })}
                    style={{ flex: 1 }}
                  >
                    Always
                  </SegmentedButton>
                  <SegmentedButton
                    isActive={recurrence.type === "weekly" || recurrence.type === "specific_dates"}
                    onPress={() => setShowCustomRecurrenceModal(true)}
                    style={{ flex: 1 }}
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

      {/* Saved Locations Modal */}
      <Modal visible={showSavedLocationsModal} transparent animationType="slide" onRequestClose={() => setShowSavedLocationsModal(false)}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.overlay} onPress={() => setShowSavedLocationsModal(false)} />
          <View style={[styles.savedLocationsSheet, { backgroundColor: colors.backgroundRoot }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Locations</Text>
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {presets.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Feather name="map-pin" size={48} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No saved locations yet.
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.tabIconDefault }]}>
                    Save locations from the map to quickly reuse them.
                  </Text>
                </View>
              ) : (
                <View style={styles.presetsContainer}>
                  {presets.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleSavedLocationSelect({
                          name: preset.name,
                          coordinates: preset.coordinates,
                        });
                      }}
                    >
                      <View style={styles.presetIconContainer}>
                        <Text style={styles.presetIcon}>{preset.icon || "📍"}</Text>
                      </View>
                      <View style={styles.presetInfo}>
                        <Text style={[styles.presetName, { color: colors.text }]}>{preset.name}</Text>
                        {preset.address && (
                          <Text style={[styles.presetAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                            {preset.address}
                          </Text>
                        )}
                      </View>
                      <Feather name="chevron-right" size={20} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    maxHeight: "90%",
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
    borderBottomWidth: 0,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flexGrow: 1,
  },
  formContainer: {
    paddingTop: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  topDivider: {
    height: 1,
    width: "100%",
    marginBottom: 0,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
  },
  labelContainer: {
    width: 64,
    flexShrink: 0,
  },
  label: {
    fontSize: 16,
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
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
      },
  segmentedButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  whereContainer: {
    gap: 12,
  },
  selectedLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedLocationText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 30,
    flexShrink: 0,
  },
  submitButton: {
    width: "100%",
  },
  savedLocationsSheet: {
    width: "100%",
    maxWidth: 512,
    maxHeight: "70%",
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
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  presetsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  presetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  presetIcon: {
    fontSize: 24,
  },
  presetInfo: {
    flex: 1,
    gap: 4,
  },
  presetName: {
    fontSize: 16,
    fontWeight: "600",
  },
  presetAddress: {
    fontSize: 14,
  },
});
