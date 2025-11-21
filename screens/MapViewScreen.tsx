import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Modal, Pressable, TouchableOpacity, Text, TextInput, FlatList, Keyboard, TouchableWithoutFeedback } from "react-native";
import MapView, { Marker, Circle, MapPressEvent } from "react-native-maps";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { useDebounce } from "../hooks/useDebounce";
import { Spacing, BorderRadius } from "../constants/theme";
import { reverseGeocode, searchLocation, formatAddress, calculateDistance, formatDistance, SearchResult } from "../services/locationService";
import AddReminderSheet from "../components/AddReminderSheet";
import * as Haptics from "expo-haptics";

interface TempMarker {
  coordinate: { latitude: number; longitude: number };
  address: string;
}

export default function MapViewScreen() {
  const { colors } = useTheme();
  const { reminders, addReminder, updateReminder, archiveReminder, settings } = useReminders();
  const { position, isLoading, error } = useLocationPermission();
  const mapRef = useRef<MapView>(null);

  const [tempMarker, setTempMarker] = useState<TempMarker | null>(null);
  const [searchMarker, setSearchMarker] = useState<{ coordinate: { latitude: number; longitude: number }; address: string } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [prefilledLocation, setPrefilledLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    name: string;
  } | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Search bar state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const activeReminders = reminders.filter((r) => r.status === "active");

  // Group reminders by location (cluster nearby reminders)
  const clusterReminders = (reminders: any[]) => {
    const clusters: { [key: string]: any[] } = {};
    const clusterDistance = 0.001; // ~100 meters

    reminders.forEach((reminder) => {
      const lat = Math.round(reminder.location.latitude / clusterDistance) * clusterDistance;
      const lon = Math.round(reminder.location.longitude / clusterDistance) * clusterDistance;
      const key = `${lat},${lon}`;

      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(reminder);
    });

    return Object.values(clusters);
  };

  const reminderClusters = clusterReminders(activeReminders);

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
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }, 1000);
      }
    }
  }, [position, activeReminders.length]);

  // Reset global search when search term changes
  useEffect(() => {
    setIsGlobalSearch(false);
  }, [searchTerm]);

  // Search effect
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setIsSearching(true);
      console.log(`Starting ${isGlobalSearch ? 'global' : 'local'} search for: "${debouncedSearchTerm}"`);

      searchLocation(
        debouncedSearchTerm,
        position || undefined,
        { global: isGlobalSearch, radiusMiles: 100 }
      )
        .then((data) => {
          console.log(`Search results for "${debouncedSearchTerm}":`, data?.length || 0, 'results');
          if (data && data.length > 0) {
            console.log('First result:', {
              name: data[0].display_name,
              lat: data[0].lat,
              lon: data[0].lon
            });
          }
          // Sort by proximity if user position is available
          let results = data || [];
          if (position && results.length > 0) {
            results.sort((a, b) => {
              const distA = calculateDistance(
                position.latitude,
                position.longitude,
                parseFloat(a.lat),
                parseFloat(a.lon)
              );
              const distB = calculateDistance(
                position.latitude,
                position.longitude,
                parseFloat(b.lat),
                parseFloat(b.lon)
              );
              return distA - distB;
            });
          }
          setSearchResults(results);
          setShowSearchResults(true);
        })
        .catch((err) => {
          console.error("Map search error:", err);
          // Don't show error to user, just clear results
          setSearchResults([]);
          setShowSearchResults(true); // Still show dropdown to indicate "no results"
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchTerm, position, isGlobalSearch]);

  const handleMapPress = async (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Clear search results when clicking on map
    setSearchResults([]);
    setShowSearchResults(false);
    Keyboard.dismiss();

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

  // Track if we're programmatically moving the map
  const [isProgrammaticMove, setIsProgrammaticMove] = useState(false);

  const handleRegionChangeComplete = () => {
    // Only clear search marker if user manually panned/zoomed (not programmatic)
    if (searchMarker && !isProgrammaticMove) {
      console.log('User moved map, clearing search marker');
      setSearchMarker(null);
    }
    setIsProgrammaticMove(false);
  };

  const handleSearchMarkerPress = () => {
    if (!searchMarker) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Set up to create a reminder at this location
    setPrefilledLocation({
      coordinates: searchMarker.coordinate,
      name: searchMarker.address,
    });
    setTempMarker({
      coordinate: searchMarker.coordinate,
      address: searchMarker.address,
    });
    setShowLocationModal(true);
  };

  const handleMapTap = () => {
    // Clear search results when tapping on map (not long press)
    if (showSearchResults) {
      setSearchResults([]);
      setShowSearchResults(false);
      Keyboard.dismiss();
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

  const handleMarkerPress = (cluster: any[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If cluster has only one reminder, show it directly
    if (cluster.length === 1) {
      const reminder = cluster[0];

      // Zoom to the reminder location
      if (mapRef.current && reminder.location) {
        setIsProgrammaticMove(true);
        mapRef.current.animateToRegion({
          latitude: reminder.location.latitude,
          longitude: reminder.location.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }, 500);
      }

      setSelectedReminder(reminder);
      setShowReminderModal(true);
    } else {
      // If multiple reminders, show the first one (could be enhanced to show a list)
      const reminder = cluster[0];

      if (mapRef.current && reminder.location) {
        setIsProgrammaticMove(true);
        mapRef.current.animateToRegion({
          latitude: reminder.location.latitude,
          longitude: reminder.location.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }, 500);
      }

      setSelectedReminder(reminder);
      setShowReminderModal(true);
    }
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
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
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

  const handleSearchResultSelect = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    const address = formatAddress(result.display_name, result.address);

    console.log('Selected search result:', { latitude, longitude, address });

    // Always show search marker
    console.log('Setting search marker at:', { latitude, longitude });
    setSearchMarker({
      coordinate: { latitude, longitude },
      address,
    });

    // Set flag to prevent clearing marker on programmatic map move
    setIsProgrammaticMove(true);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01, // More zoomed in (was 0.05)
        longitudeDelta: 0.01,
      }, 500);
    }

    // Clear search UI
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
        showsUserLocation
        showsCompass
        showsScale
        onPress={handleMapTap}
        onLongPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Render reminder markers with counts */}
        {reminderClusters.map((cluster, index) => {
          const firstReminder = cluster[0];
          const count = cluster.length;

          return (
            <Marker
              key={`cluster-${index}`}
              coordinate={{
                latitude: firstReminder.location.latitude,
                longitude: firstReminder.location.longitude,
              }}
              onPress={() => handleMarkerPress(cluster)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerContainer}>
                <View style={styles.pinBackground}>
                  <MaterialCommunityIcons name="map-marker" size={32} color="#FF8C42" />
                </View>
                {count > 1 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}

        {/* Search result marker (green) */}
        {searchMarker && (
          <Marker
            coordinate={searchMarker.coordinate}
            onPress={handleSearchMarkerPress}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.pinBackground}>
                <MaterialCommunityIcons name="map-marker" size={32} color="#10B981" />
              </View>
            </View>
          </Marker>
        )}

        {/* Temporary marker for tap location (red) */}
        {tempMarker && (
          <Marker coordinate={tempMarker.coordinate} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerContainer}>
              <View style={styles.pinBackground}>
                <MaterialCommunityIcons name="map-marker" size={32} color="#FF6B6B" />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundRoot }]}>
          {isGlobalSearch ? (
            <Feather name="globe" size={20} color={colors.primary} />
          ) : (
            <Feather name="search" size={20} color={colors.tabIconDefault} />
          )}
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={isGlobalSearch ? "Searching globally..." : "Search for a place or address"}
            placeholderTextColor={colors.tabIconDefault}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={true}
            returnKeyType="search"
            keyboardType="default"
            textContentType="fullStreetAddress"
          />
          {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm("");
                setSearchResults([]);
                setShowSearchResults(false);
                setIsGlobalSearch(false);
                Keyboard.dismiss();
              }}
            >
              <Feather name="x" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && searchTerm.trim() !== "" && (
          <View style={[styles.searchResultsContainer, { backgroundColor: colors.backgroundRoot }]}>
            {/* Global Search Toggle Button - Always visible when searching */}
            {!isGlobalSearch && (
              <TouchableOpacity
                style={[styles.globalSearchButton, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsGlobalSearch(true);
                }}
              >
                <Feather name="globe" size={16} color={colors.primary} />
                <Text style={[styles.globalSearchButtonText, { color: colors.text }]}>
                  Search Globally
                </Text>
              </TouchableOpacity>
            )}

            {/* Results List */}
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={({ item }) => {
                  const distance = position
                    ? calculateDistance(
                        position.latitude,
                        position.longitude,
                        parseFloat(item.lat),
                        parseFloat(item.lon)
                      )
                    : null;

                  return (
                    <TouchableOpacity
                      style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSearchResultSelect(item)}
                    >
                      <Feather name="map-pin" size={18} color={colors.tabIconDefault} />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={[styles.searchResultText, { color: colors.text }]} numberOfLines={2}>
                          {formatAddress(item.display_name, item.address)}
                        </Text>
                        {distance !== null && (
                          <Text style={[styles.searchResultDistance, { color: colors.tabIconDefault }]}>
                            {formatDistance(distance, settings.distanceUnit)} away
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyboardShouldPersistTaps="handled"
                style={styles.searchResultsList}
              />
            ) : !isSearching ? (
              <Text style={[styles.emptySearchText, { color: colors.tabIconDefault }]}>
                {isGlobalSearch ? 'No locations found worldwide' : 'No locations found nearby'}
              </Text>
            ) : null}
          </View>
        )}
      </View>

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
    </TouchableWithoutFeedback>
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
  searchContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: BorderRadius.md,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResultsContainer: {
    marginTop: 8,
    borderRadius: BorderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 300,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 14,
    lineHeight: 18,
  },
  searchResultDistance: {
    fontSize: 12,
    marginTop: 4,
  },
  emptySearchText: {
    textAlign: "center",
    padding: 16,
    fontSize: 14,
  },
  globalSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  globalSearchButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pinBackground: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF8C42",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  countText: {
    color: "#FF8C42",
    fontSize: 11,
    fontWeight: "700",
  },
});
