import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { Spacing, BorderRadius } from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapViewScreen() {
  const { colors } = useTheme();
  const { reminders } = useReminders();
  const { position, isLoading, error } = useLocationPermission();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const activeReminders = reminders.filter((r) => r.status === "active");

  // Center map on user location when it loads
  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [position]);

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
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {/* Render reminder markers */}
        {activeReminders.map((reminder) => (
          <React.Fragment key={reminder.id}>
            {/* Marker */}
            <Marker
              coordinate={{
                latitude: reminder.location.latitude,
                longitude: reminder.location.longitude,
              }}
              title={reminder.task}
              description={reminder.locationName}
              pinColor={reminder.trigger === "arriving" ? colors.primary : colors.orange}
            />
            {/* Geofence circle */}
            <Circle
              center={{
                latitude: reminder.location.latitude,
                longitude: reminder.location.longitude,
              }}
              radius={reminder.radius}
              strokeColor={reminder.trigger === "arriving" ? colors.primary + "80" : colors.orange + "80"}
              fillColor={reminder.trigger === "arriving" ? colors.primary + "20" : colors.orange + "20"}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Header overlay */}
      <View
        style={[
          styles.headerOverlay,
          {
            paddingTop: insets.top + Spacing.lg,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Image source={require("../assets/images/icon.png")} style={styles.logo} />
          <ThemedText style={styles.appName}>ReMind</ThemedText>
        </View>
      </View>
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
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },
});
