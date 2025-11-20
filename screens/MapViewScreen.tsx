import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Modal, Pressable, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, Circle, MapPressEvent } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { Spacing, BorderRadius } from "../constants/theme";
import { reverseGeocode } from "../services/locationService";
import AddReminderSheet from "../components/AddReminderSheet";
import * as Haptics from "expo-haptics";

interface TempMarker {
  coordinate: { latitude: number; longitude: number };
  address: string;
}

export default function MapViewScreen() {
  const { colors } = useTheme();
  const { reminders, addReminder, updateReminder, archiveReminder } = useReminders();
  const { position, isLoading, error } = useLocationPermission();
  const mapRef = useRef<MapView>(null);

  const [tempMarker, setTempMarker] = useState<TempMarker | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [prefilledLocation, setPrefilledLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    name: string;
  } | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const activeReminders = reminders.filter((r) => r.status === "active");

  // Debug: Log reminders
  useEffect(() => {
    console.log("Total reminders:", reminders.length);
    console.log("Active reminders:", activeReminders.length);
    if (activeReminders.length > 0) {
      console.log("First reminder location:", activeReminders[0].location);
      console.log("First reminder:", JSON.stringify(activeReminders[0], null, 2));
    }
  }, [reminders, activeReminders.length]);

  // Center map to show user location and all reminders
  useEffect(() => {
    if (position && mapRef.current) {
      // If there are reminders, fit them all on screen
      if (activeReminders.length > 0) {
        const coordinates = [
          { latitude: position.latitude, longitude: position.longitude },
          ...activeReminders.map((r) => ({
            latitude: r.location.latitude,
            longitude: r.location.longitude,
          })),
        ];

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      } else {
        // No reminders, just center on user
        mapRef.current.animateToRegion({
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    }
  }, [position, activeReminders.length]);

  const handleMapPress = async (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Show red marker immediately
    setTempMarker({ coordinate, address: 'Loading address...' });
    setShowLocationModal(true);

    // Get address in background
    try {
      const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);
      setTempMarker({ coordinate, address });
      setPrefilledLocation({ coordinates: coordinate, name: address });
    } catch (error) {
      console.error('Error getting address:', error);
      setTempMarker({ coordinate, address: 'Unknown location' });
      setPrefilledLocation({ coordinates: coordinate, name: 'Unknown location' });
    }
  };

  const handleAddReminderHere = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLocationModal(false);
    setShowAddReminder(true);
  };

  const handleCancelLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLocationModal(false);
    setTempMarker(null);
    setPrefilledLocation(null);
  };

  const handleSaveReminder = async (reminder: any) => {
    // If we have a prefilled location, use it
    if (prefilledLocation) {
      reminder.location = prefilledLocation.coordinates;
      reminder.locationName = prefilledLocation.name;
    }

    // Check if we're editing an existing reminder
    if (selectedReminder && showAddReminder) {
      // Update existing reminder
      await updateReminder(selectedReminder.id, reminder);
      console.log("Reminder updated successfully");
    } else {
      // Create new reminder
      await addReminder(reminder);
      console.log("New reminder created successfully");
    }

    // Clean up
    setShowAddReminder(false);
    setTempMarker(null);
    setPrefilledLocation(null);
    setSelectedReminder(null);
  };

  const handleCloseAddReminder = () => {
    setShowAddReminder(false);
    setSelectedReminder(null);
    // Don't clear temp marker in case user wants to try again
  };

  const handleMarkerPress = (reminder: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReminder(reminder);
    setShowReminderModal(true);
  };

  const handleCreateReminderHere = () => {
    if (!selectedReminder) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReminderModal(false);

    // Pre-fill location from the selected reminder
    setPrefilledLocation({
      coordinates: {
        latitude: selectedReminder.location.latitude,
        longitude: selectedReminder.location.longitude,
      },
      name: selectedReminder.locationName,
    });

    // Clear selectedReminder so we create a NEW reminder, not edit the existing one
    setSelectedReminder(null);
    setShowAddReminder(true);
  };

  const handleEditReminder = () => {
    if (!selectedReminder) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReminderModal(false);

    // Open AddReminderSheet in edit mode with existing reminder data
    // selectedReminder is already set from handleMarkerPress
    setShowAddReminder(true);
  };

  const handleDeleteReminder = async () => {
    if (!selectedReminder) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReminderModal(false);

    // Show confirmation before deleting
    // Note: In React Native, we'd typically use Alert.alert for confirmation
    // For now, implementing direct delete - can add Alert.alert if needed
    try {
      await archiveReminder(selectedReminder.id);
      console.log("Reminder archived successfully");
    } catch (error) {
      console.error("Failed to archive reminder:", error);
    }
  };

  const handleCancelReminderModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReminderModal(false);
    setSelectedReminder(null);
  };

  const handleCenterOnUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (position && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleShowAllPins = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (position && mapRef.current && activeReminders.length > 0) {
      const coordinates = [
        { latitude: position.latitude, longitude: position.longitude },
        ...activeReminders.map((r) => ({
          latitude: r.location.latitude,
          longitude: r.location.longitude,
        })),
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.backgroundDefault }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
          Loading map...
        </ThemedText>
      </View>
    );
  }

  if (error || !position) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.backgroundDefault }]}>
        <Feather name="alert-circle" size={80} color={colors.danger} />
        <ThemedText style={[styles.errorText, { color: colors.text }]}>
          Unable to load map
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: colors.tabIconDefault }]}>
          {error || "Please enable location permissions"}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsCompass
        showsScale
        onLongPress={handleMapPress}
      >
        {/* Render reminder markers */}
        {activeReminders.map((reminder) => (
          <Marker
            key={reminder.id}
            coordinate={{
              latitude: reminder.location.latitude,
              longitude: reminder.location.longitude,
            }}
            pinColor={colors.coral}
            onPress={() => handleMarkerPress(reminder)}
          />
        ))}

        {/* Temporary marker for tap location */}
        {tempMarker && (
          <Marker coordinate={tempMarker.coordinate}>
            <View style={styles.tempMarkerContainer}>
              <View style={styles.tempMarker} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map control buttons */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.backgroundRoot }]}
          onPress={handleCenterOnUser}
        >
          <Feather name="navigation" size={20} color={colors.primary} />
        </TouchableOpacity>

        {activeReminders.length > 0 && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.backgroundRoot }]}
            onPress={handleShowAllPins}
          >
            <Feather name="maximize-2" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Location confirmation bottom sheet */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelLocation}
      >
        <Pressable style={styles.bottomSheetOverlay} onPress={handleCancelLocation}>
          <Pressable
            style={[styles.bottomSheet, { backgroundColor: colors.backgroundRoot }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <Feather name="map-pin" size={20} color={colors.primary} />
                {tempMarker?.address === 'Loading address...' ? (
                  <View style={styles.loadingAddressContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.sheetAddress, { color: colors.tabIconDefault }]}>
                      Loading...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.sheetAddress, { color: colors.text }]} numberOfLines={2}>
                    {tempMarker?.address || 'Unknown location'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.sheetButton, { backgroundColor: colors.primary }]}
                onPress={handleAddReminderHere}
                disabled={tempMarker?.address === 'Loading address...'}
              >
                <Text style={styles.sheetButtonText}>Create Reminder</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Existing Reminder Actions Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelReminderModal}
      >
        <Pressable style={styles.bottomSheetOverlay} onPress={handleCancelReminderModal}>
          <Pressable
            style={[styles.bottomSheet, { backgroundColor: colors.backgroundRoot }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetContent}>
              <View style={styles.reminderModalHeader}>
                <Feather name="map-pin" size={20} color={colors.coral} />
                <Text style={[styles.reminderModalTitle, { color: colors.text }]} numberOfLines={2}>
                  {selectedReminder?.task}
                </Text>
              </View>

              <Text style={[styles.reminderModalLocation, { color: colors.tabIconDefault }]} numberOfLines={1}>
                {selectedReminder?.locationName}
              </Text>

              <View style={styles.reminderModalButtons}>
                <TouchableOpacity
                  style={[styles.reminderModalButton, { backgroundColor: colors.success }]}
                  onPress={handleCreateReminderHere}
                >
                  <Feather name="plus-circle" size={18} color={colors.buttonText} />
                  <Text style={styles.reminderModalButtonText}>Create New Reminder Here</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reminderModalButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditReminder}
                >
                  <Feather name="edit-2" size={18} color={colors.buttonText} />
                  <Text style={styles.reminderModalButtonText}>Edit This Reminder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reminderModalButton, { backgroundColor: colors.destructive }]}
                  onPress={handleDeleteReminder}
                >
                  <Feather name="trash-2" size={18} color={colors.buttonText} />
                  <Text style={styles.reminderModalButtonText}>Archive</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Reminder Sheet */}
      <AddReminderSheet
        isOpen={showAddReminder}
        onClose={handleCloseAddReminder}
        onSave={handleSaveReminder}
        existingReminder={selectedReminder}
        prefilledLocation={prefilledLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: "absolute",
    bottom: 80,
    right: 16,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  tempMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tempMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF6B6B", // colors.coral
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#C4C4C4", // colors.disabled
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetContent: {
    paddingHorizontal: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.lg,
  },
  loadingAddressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetAddress: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  sheetButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sheetButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  reminderModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.sm,
  },
  reminderModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  reminderModalLocation: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    paddingLeft: 32,
  },
  reminderModalButtons: {
    gap: 12,
  },
  reminderModalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  reminderModalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
