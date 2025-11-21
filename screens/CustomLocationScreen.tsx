import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { useDebounce } from "../hooks/useDebounce";
import { useReminders } from "../hooks/useReminders";
import { useLocationPresets } from "../hooks/useLocationPresets";
import {
  searchLocation,
  formatAddress,
  calculateDistance,
  formatDistance,
  reverseGeocode,
  SearchResult,
} from "../services/locationService";
import { Spacing, BorderRadius } from "../constants/theme";
import { Coordinates, LocationPreset } from "../types";

interface CustomLocationScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: { name: string; coordinates: Coordinates }) => void;
}

export default function CustomLocationScreen({
  isOpen,
  onClose,
  onSelect,
}: CustomLocationScreenProps) {
  const { colors } = useTheme();
  const { settings } = useReminders();
  const { presets, createPreset, updatePreset, deletePreset, loading: presetsLoading } = useLocationPresets();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [locationToSave, setLocationToSave] = useState<{ name: string; coordinates: Coordinates; address: string } | null>(null);
  const [presetToEdit, setPresetToEdit] = useState<LocationPreset | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);

  const { position: userPosition, isLoading: locationLoading } = useLocationPermission();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Stabilize position to prevent re-renders
  const stablePosition = useMemo(() => {
    if (!userPosition) return null;
    return {
      latitude: Math.round(userPosition.latitude * 10000) / 10000,
      longitude: Math.round(userPosition.longitude * 10000) / 10000,
    };
  }, [
    userPosition ? Math.round(userPosition.latitude * 10000) : null,
    userPosition ? Math.round(userPosition.longitude * 10000) : null,
  ]);

  // Search effect
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setIsLoading(true);
      setError(null);

      console.log(`Starting ${isGlobalSearch ? 'global' : 'local'} search for: "${debouncedSearchTerm}"`);

      searchLocation(debouncedSearchTerm, stablePosition || undefined, { global: isGlobalSearch, radiusMiles: 100 })
        .then((data) => {
          console.log(`Custom location search results for "${debouncedSearchTerm}":`, data?.length || 0, 'results');
          // Sort by proximity if user position is available
          let results = data || [];
          if (stablePosition && results.length > 0) {
            results.sort((a, b) => {
              const distA = calculateDistance(
                stablePosition.latitude,
                stablePosition.longitude,
                parseFloat(a.lat),
                parseFloat(a.lon)
              );
              const distB = calculateDistance(
                stablePosition.latitude,
                stablePosition.longitude,
                parseFloat(b.lat),
                parseFloat(b.lon)
              );
              return distA - distB;
            });
          }
          setResults(results);
          setError(null);
        })
        .catch((err) => {
          console.error("Custom location search error:", err);
          // Don't show error to user, just show empty results
          setResults([]);
          setError(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
      setError(null);
      setIsGlobalSearch(false); // Reset to local when clearing search
    }
  }, [debouncedSearchTerm, stablePosition, isGlobalSearch]);

  const handleSelectResult = (result: SearchResult) => {
    const location = {
      name: formatAddress(result.display_name, result.address),
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
    };
    onSelect(location);
    setSearchTerm("");
    setResults([]);
  };

  const handleSaveCurrentLocation = async () => {
    if (!userPosition) return;

    try {
      setIsLoading(true);
      const address = await reverseGeocode(userPosition.latitude, userPosition.longitude);

      setLocationToSave({
        name: address,
        coordinates: userPosition,
        address,
      });
      setShowSaveDialog(true);
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setError("Failed to get address for current location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFromSearch = (result: SearchResult) => {
    const address = formatAddress(result.display_name, result.address);
    setLocationToSave({
      name: address,
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
      address,
    });
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async (name: string) => {
    if (!locationToSave || !name.trim()) return;

    try {
      setSavingPreset(true);
      await createPreset({
        name: name.trim(),
        coordinates: locationToSave.coordinates,
        address: locationToSave.address,
      });
      setShowSaveDialog(false);
      setLocationToSave(null);
      // Success - no need to show alert, location will appear in grid
    } catch (error) {
      console.error("Failed to save location:", error);
      Alert.alert("Error", "Failed to save location");
    } finally {
      setSavingPreset(false);
    }
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    if (editMode) return; // Don't select in edit mode

    onSelect({
      name: preset.name,
      coordinates: preset.coordinates,
    });
    setSearchTerm("");
    setResults([]);
  };

  const handleEditPreset = (preset: LocationPreset) => {
    setPresetToEdit(preset);
    setShowEditDialog(true);
  };

  const handleConfirmEdit = async (name: string, newLocation?: { coordinates: Coordinates; address: string }) => {
    if (!presetToEdit || !name.trim()) return;

    try {
      setSavingPreset(true);
      await updatePreset(presetToEdit.id, {
        name: name.trim(),
        ...(newLocation && {
          coordinates: newLocation.coordinates,
          address: newLocation.address,
        }),
      });
      setShowEditDialog(false);
      setPresetToEdit(null);
      // Success - no need to show alert, location will update in grid
    } catch (error) {
      console.error("Failed to update location:", error);
      Alert.alert("Error", "Failed to update location");
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = (preset: LocationPreset) => {
    Alert.alert(
      "Delete Location",
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePreset(preset.id);
              // Exit edit mode if no presets left
              if (presets.length === 1) {
                setEditMode(false);
              }
            } catch (error) {
              console.error("Failed to delete location:", error);
              Alert.alert("Error", "Failed to delete location");
            }
          },
        },
      ]
    );
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
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Where?</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundDefault }]}>
              <Feather name="search" size={20} color={colors.tabIconDefault} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search for a place or address"
                placeholderTextColor={colors.tabIconDefault}
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
                autoCorrect={true}
                returnKeyType="search"
              />
              {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>

          {/* Search Results */}
          {searchTerm.trim() !== "" && (
            <View style={styles.resultsContainer}>
              {/* Global Search Toggle Button - Always visible when searching */}
              {!isGlobalSearch && (
                <TouchableOpacity
                  style={[styles.globalSearchButton, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}
                  onPress={() => setIsGlobalSearch(true)}
                >
                  <Feather name="globe" size={16} color={colors.primary} />
                  <Text style={[styles.globalSearchButtonText, { color: colors.text }]}>
                    Search Globally
                  </Text>
                </TouchableOpacity>
              )}

              {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
              {!isLoading && results.length === 0 && searchTerm.trim() !== "" && (
                <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                  No locations found
                </Text>
              )}
              <FlatList
                data={results}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={({ item }) => {
                  const distance = stablePosition
                    ? calculateDistance(
                        stablePosition.latitude,
                        stablePosition.longitude,
                        parseFloat(item.lat),
                        parseFloat(item.lon)
                      )
                    : null;

                  return (
                    <View style={styles.resultItemContainer}>
                      <TouchableOpacity
                        style={[styles.resultItem, { backgroundColor: colors.backgroundDefault }]}
                        onPress={() => handleSelectResult(item)}
                      >
                        <Feather name="map-pin" size={20} color={colors.tabIconDefault} />
                        <View style={styles.resultTextContainer}>
                          <Text style={[styles.resultText, { color: colors.text }]}>
                            {formatAddress(item.display_name, item.address)}
                          </Text>
                          {distance !== null && (
                            <Text style={[styles.distanceText, { color: colors.tabIconDefault }]}>
                              {formatDistance(distance, settings.distanceUnit)} away
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => handleSaveFromSearch(item)}
                      >
                        <Feather name="bookmark" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  );
                }}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Saved Locations Section */}
          {searchTerm.trim() === "" && !presetsLoading && (
            <View style={styles.savedLocationsContainer}>
              {presets.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Locations</Text>
                  </View>
                  <View style={styles.presetsGrid}>
                    {presets.map((preset) => (
                      <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetCard, { backgroundColor: colors.surface }]}
                        onPress={() => handleSelectPreset(preset)}
                        disabled={editMode}
                      >
                        <View style={styles.presetContent}>
                          <Text style={styles.presetIcon}>{preset.icon || '📍'}</Text>
                          <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>
                            {preset.name}
                          </Text>
                          {preset.address && (
                            <Text style={[styles.presetAddress, { color: colors.tabIconDefault }]} numberOfLines={2}>
                              {preset.address}
                            </Text>
                          )}
                        </View>
                        {editMode && (
                          <View style={styles.presetActions}>
                            <TouchableOpacity
                              style={styles.presetActionButton}
                              onPress={() => handleEditPreset(preset)}
                            >
                              <Feather name="edit-2" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.presetActionButton}
                              onPress={() => handleDeletePreset(preset)}
                            >
                              <Feather name="trash-2" size={18} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {userPosition && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface }]}
                    onPress={handleSaveCurrentLocation}
                    disabled={locationLoading || isLoading}
                  >
                    <Feather name="navigation" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>
                      Save Current Location
                    </Text>
                    {(locationLoading || isLoading) && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                {presets.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface }]}
                    onPress={() => setEditMode(!editMode)}
                  >
                    <Feather name={editMode ? "check" : "edit-3"} size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>
                      {editMode ? "Done Editing" : "Edit Saved Locations"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Save Location Dialog */}
        {showSaveDialog && locationToSave && (
          <SaveLocationDialog
            isOpen={showSaveDialog}
            initialName={locationToSave.name}
            address={locationToSave.address}
            onSave={handleConfirmSave}
            onClose={() => {
              setShowSaveDialog(false);
              setLocationToSave(null);
            }}
            saving={savingPreset}
          />
        )}

        {/* Edit Location Dialog */}
        {showEditDialog && presetToEdit && (
          <EditLocationDialog
            isOpen={showEditDialog}
            preset={presetToEdit}
            onSave={handleConfirmEdit}
            onClose={() => {
              setShowEditDialog(false);
              setPresetToEdit(null);
            }}
            saving={savingPreset}
          />
        )}
      </View>
    </Modal>
  );
}

// Save Location Dialog Component
function SaveLocationDialog({
  isOpen,
  initialName,
  address,
  onSave,
  onClose,
  saving,
}: {
  isOpen: boolean;
  initialName: string;
  address: string;
  onSave: (name: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialName);

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.dialogOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.dialogOverlay}>
            <Pressable style={styles.dialogBackdrop} onPress={onClose} />
            <TouchableWithoutFeedback>
              <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>Save Location</Text>

                <View style={styles.dialogContent}>
                  <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>Location Name</Text>
                  <TextInput
                    style={[styles.dialogInput, { color: colors.text, borderColor: colors.border }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Home, Work, Gym"
                    placeholderTextColor={colors.tabIconDefault}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      if (name.trim()) {
                        onSave(name);
                      }
                    }}
                  />

                  <Text style={[styles.dialogLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                    Address
                  </Text>
                  <Text style={[styles.dialogAddress, { color: colors.text }]}>{address}</Text>
                </View>

                <View style={styles.dialogActions}>
                  <TouchableOpacity
                    style={[styles.dialogButton, styles.dialogButtonSecondary]}
                    onPress={onClose}
                    disabled={saving}
                  >
                    <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dialogButton, styles.dialogButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => onSave(name)}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.dialogButtonText, { color: colors.buttonText }]}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Edit Location Dialog Component
function EditLocationDialog({
  isOpen,
  preset,
  onSave,
  onClose,
  saving,
}: {
  isOpen: boolean;
  preset: LocationPreset;
  onSave: (name: string, newLocation?: { coordinates: Coordinates; address: string }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(preset.name);

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.dialogOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.dialogOverlay}>
            <Pressable style={styles.dialogBackdrop} onPress={onClose} />
            <TouchableWithoutFeedback>
              <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>Edit Location</Text>

                <View style={styles.dialogContent}>
                  <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>Location Name</Text>
                  <TextInput
                    style={[styles.dialogInput, { color: colors.text, borderColor: colors.border }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Home, Work, Gym"
                    placeholderTextColor={colors.tabIconDefault}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      if (name.trim()) {
                        onSave(name);
                      }
                    }}
                  />

                  <Text style={[styles.dialogLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                    Current Address
                  </Text>
                  <Text style={[styles.dialogAddress, { color: colors.text }]}>
                    {preset.address || "No address"}
                  </Text>
                </View>

                <View style={styles.dialogActions}>
                  <TouchableOpacity
                    style={[styles.dialogButton, styles.dialogButtonSecondary]}
                    onPress={onClose}
                    disabled={saving}
                  >
                    <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dialogButton, styles.dialogButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => onSave(name)}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.dialogButtonText, { color: colors.buttonText }]}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchContainer: {
    padding: Spacing.xl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  distanceText: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    textAlign: "center",
    padding: Spacing.lg,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    padding: Spacing.lg,
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
    marginHorizontal: Spacing.xl,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  globalSearchButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  currentLocationContainer: {
    padding: Spacing.xl,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  currentLocationText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  bookmarkButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  savedLocationsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  presetCard: {
    width: "48%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetContent: {
    flex: 1,
  },
  presetIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  presetName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  presetAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  presetActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  presetActionButton: {
    padding: Spacing.sm,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dialogBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogContainer: {
    width: "85%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  dialogContent: {
    marginBottom: Spacing.xl,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  dialogAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogButtonSecondary: {
    backgroundColor: "#F5F5F5",
  },
  dialogButtonPrimary: {
    // backgroundColor set dynamically via colors.primary
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
