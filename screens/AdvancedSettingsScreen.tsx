import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useReminders } from "@/hooks/useReminders";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function AdvancedSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useReminders();
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [showAccuracyPicker, setShowAccuracyPicker] = useState(false);
  const [showDwellTimePicker, setShowDwellTimePicker] = useState(false);

  const radiusOptions = [50, 100, 200, 300, 500, 1000];
  const accuracyOptions: Array<"high" | "balanced" | "battery"> = ["high", "balanced", "battery"];
  const dwellTimeOptions = [0, 30, 60, 120, 300];

  const getAccuracyLabel = (mode: "high" | "balanced" | "battery") => {
    switch (mode) {
      case "high":
        return "High (Most Accurate)";
      case "balanced":
        return "Balanced";
      case "battery":
        return "Battery Saver";
    }
  };

  const getDwellTimeLabel = (seconds: number) => {
    if (seconds === 0) return "Immediate";
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.background }}>
      {/* Display Preferences */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Display Preferences</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            updateSettings({ distanceUnit: settings.distanceUnit === "miles" ? "km" : "miles" });
          }}
        >
          <View style={styles.settingRow}>
            <ThemedText>Distance Unit</ThemedText>
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              {settings.distanceUnit === "miles" ? "Miles" : "Kilometers"}
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            updateSettings({ timeFormat: settings.timeFormat === "12h" ? "24h" : "12h" });
          }}
        >
          <View style={styles.settingRow}>
            <ThemedText>Time Format</ThemedText>
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              {settings.timeFormat === "12h" ? "12 Hour" : "24 Hour"}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {/* Location Settings */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Location Settings</ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowRadiusPicker(true);
          }}
        >
          <View style={styles.settingRow}>
            <View>
              <ThemedText style={styles.settingLabel}>Default Radius</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.tabIconDefault }]}>
                How close you need to be
              </ThemedText>
            </View>
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              {settings.defaultRadius}m
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowAccuracyPicker(true);
          }}
        >
          <View style={styles.settingRow}>
            <View>
              <ThemedText style={styles.settingLabel}>Accuracy Mode</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.tabIconDefault }]}>
                Balance accuracy vs battery
              </ThemedText>
            </View>
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              {getAccuracyLabel(settings.accuracyMode)}
            </ThemedText>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowDwellTimePicker(true);
          }}
        >
          <View style={styles.settingRow}>
            <View>
              <ThemedText style={styles.settingLabel}>Dwell Time</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.tabIconDefault }]}>
                Wait before triggering
              </ThemedText>
            </View>
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              {getDwellTimeLabel(settings.dwellTime)}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {/* Radius Picker Modal */}
      <Modal visible={showRadiusPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowRadiusPicker(false)}>
          <Pressable style={[styles.pickerModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <ThemedText style={styles.pickerTitle}>Default Radius</ThemedText>
              <Pressable onPress={() => setShowRadiusPicker(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {radiusOptions.map((radius) => (
                <Pressable
                  key={radius}
                  style={({ pressed }) => [
                    styles.pickerOption,
                    {
                      backgroundColor: settings.defaultRadius === radius ? colors.coralLight : "transparent",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ defaultRadius: radius });
                    setShowRadiusPicker(false);
                  }}
                >
                  <ThemedText style={[
                    styles.pickerOptionText,
                    settings.defaultRadius === radius && { color: colors.coral, fontWeight: "600" }
                  ]}>
                    {radius}m
                  </ThemedText>
                  {settings.defaultRadius === radius && (
                    <Feather name="check" size={20} color={colors.coral} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Accuracy Picker Modal */}
      <Modal visible={showAccuracyPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAccuracyPicker(false)}>
          <Pressable style={[styles.pickerModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <ThemedText style={styles.pickerTitle}>Accuracy Mode</ThemedText>
              <Pressable onPress={() => setShowAccuracyPicker(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {accuracyOptions.map((mode) => (
                <Pressable
                  key={mode}
                  style={({ pressed }) => [
                    styles.pickerOption,
                    {
                      backgroundColor: settings.accuracyMode === mode ? colors.coralLight : "transparent",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ accuracyMode: mode });
                    setShowAccuracyPicker(false);
                  }}
                >
                  <View>
                    <ThemedText style={[
                      styles.pickerOptionText,
                      settings.accuracyMode === mode && { color: colors.coral, fontWeight: "600" }
                    ]}>
                      {getAccuracyLabel(mode)}
                    </ThemedText>
                    {mode === "high" && (
                      <ThemedText style={[styles.pickerOptionDescription, { color: colors.tabIconDefault }]}>
                        Best for small areas, uses more battery
                      </ThemedText>
                    )}
                    {mode === "balanced" && (
                      <ThemedText style={[styles.pickerOptionDescription, { color: colors.tabIconDefault }]}>
                        Good accuracy with reasonable battery use
                      </ThemedText>
                    )}
                    {mode === "battery" && (
                      <ThemedText style={[styles.pickerOptionDescription, { color: colors.tabIconDefault }]}>
                        Lowest battery drain, less accurate
                      </ThemedText>
                    )}
                  </View>
                  {settings.accuracyMode === mode && (
                    <Feather name="check" size={20} color={colors.coral} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dwell Time Picker Modal */}
      <Modal visible={showDwellTimePicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDwellTimePicker(false)}>
          <Pressable style={[styles.pickerModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <ThemedText style={styles.pickerTitle}>Dwell Time</ThemedText>
              <Pressable onPress={() => setShowDwellTimePicker(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {dwellTimeOptions.map((time) => (
                <Pressable
                  key={time}
                  style={({ pressed }) => [
                    styles.pickerOption,
                    {
                      backgroundColor: settings.dwellTime === time ? colors.coralLight : "transparent",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ dwellTime: time });
                    setShowDwellTimePicker(false);
                  }}
                >
                  <ThemedText style={[
                    styles.pickerOptionText,
                    settings.dwellTime === time && { color: colors.coral, fontWeight: "600" }
                  ]}>
                    {getDwellTimeLabel(time)}
                  </ThemedText>
                  {settings.dwellTime === time && (
                    <Feather name="check" size={20} color={colors.coral} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  pickerScroll: {
    padding: Spacing.xl,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  pickerOptionText: {
    fontSize: 16,
  },
  pickerOptionDescription: {
    fontSize: 13,
    marginTop: 4,
  },
});
