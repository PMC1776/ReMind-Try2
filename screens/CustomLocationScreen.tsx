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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { useDebounce } from "../hooks/useDebounce";
import {
  searchLocation,
  formatAddress,
  calculateDistance,
  formatDistance,
  reverseGeocode,
  SearchResult,
} from "../services/locationService";
import { Spacing, BorderRadius } from "../constants/theme";
import { Coordinates } from "../types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      searchLocation(debouncedSearchTerm, stablePosition || undefined)
        .then((data) => {
          // Filter by max distance (100km)
          let filtered = data;
          if (stablePosition) {
            const MAX_DISTANCE_KM = 100;
            filtered = data.filter((result) => {
              const distance = calculateDistance(
                stablePosition.latitude,
                stablePosition.longitude,
                parseFloat(result.lat),
                parseFloat(result.lon)
              );
              return distance <= MAX_DISTANCE_KM;
            });

            // Sort by proximity
            filtered.sort((a, b) => {
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
          setResults(filtered);
        })
        .catch((err) => {
          console.error("Search error:", err);
          setError("Failed to search locations");
        })
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm, stablePosition]);

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

      const location = {
        name: address,
        coordinates: userPosition,
      };

      onSelect(location);
      setSearchTerm("");
      setResults([]);
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setError("Failed to get address for current location");
    } finally {
      setIsLoading(false);
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
                autoCorrect={false}
                returnKeyType="search"
              />
              {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>

          {/* Search Results */}
          {searchTerm.trim() !== "" && (
            <View style={styles.resultsContainer}>
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
                            {formatDistance(distance)} away
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Current Location Button */}
          {userPosition && searchTerm.trim() === "" && (
            <View style={styles.currentLocationContainer}>
              <TouchableOpacity
                style={[styles.currentLocationButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveCurrentLocation}
                disabled={locationLoading || isLoading}
              >
                <Feather name="navigation" size={20} color="#FFFFFF" />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
                {(locationLoading || isLoading) && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
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
});
