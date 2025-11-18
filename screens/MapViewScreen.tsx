import React, { useState } from "react";
import { View, StyleSheet, Image, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { Spacing, BorderRadius } from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapViewScreen() {
  const { colors } = useTheme();
  const { reminders } = useReminders();
  const insets = useSafeAreaInsets();

  const activeReminders = reminders.filter((r) => r.status === "active");
  const arrivingCount = activeReminders.filter((r) => r.trigger === "arriving").length;
  const leavingCount = activeReminders.filter((r) => r.trigger === "leaving").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.lg,
            backgroundColor: Platform.OS === "ios" ? "transparent" : colors.backgroundRoot,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Image source={require("../assets/images/icon.png")} style={styles.logo} />
          <ThemedText style={styles.appName}>ReMind</ThemedText>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Feather name="map" size={80} color={colors.tabIconDefault} />
        <ThemedText style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
          Map View
        </ThemedText>
        <ThemedText style={[styles.placeholderSubtext, { color: colors.tabIconDefault }]}>
          In the full version, this will show an interactive map with your reminder locations
        </ThemedText>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundRoot }]}>
            <View style={[styles.statBadge, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="map-pin" size={20} color={colors.primary} />
            </View>
            <ThemedText style={styles.statNumber}>{arrivingCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              Arriving
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundRoot }]}>
            <View style={[styles.statBadge, { backgroundColor: colors.orange + "20" }]}>
              <Feather name="log-out" size={20} color={colors.orange} />
            </View>
            <ThemedText style={styles.statNumber}>{leavingCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              Leaving
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  statCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    minWidth: 120,
  },
  statBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 14,
  },
});
