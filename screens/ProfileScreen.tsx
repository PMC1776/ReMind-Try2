import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import * as Haptics from "expo-haptics";

type Props = NativeStackScreenProps<ProfileStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useReminders();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleArchive = () => {
    Haptics.selectionAsync();
    navigation.navigate("Archive");
  };

  const handleNotificationTest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Test Notification", "This is a test notification!");
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "In the full version, your data would be exported as a JSON file.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. Your account will be deleted after a 30-day grace period.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {},
        },
      ]
    );
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          <ThemedText style={[styles.label, { color: colors.tabIconDefault }]}>
            User ID: {user?.id}
          </ThemedText>
        </View>
        <Button title="Archive" onPress={handleArchive} />
        <Button title="Logout" onPress={handleLogout} variant="outline" />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Location Settings</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText style={styles.label}>Default Radius</ThemedText>
          <ThemedText>{settings.defaultRadius}m</ThemedText>
        </View>
        <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText style={styles.label}>Accuracy Mode</ThemedText>
          <ThemedText style={{ textTransform: "capitalize" }}>{settings.accuracyMode}</ThemedText>
        </View>
        <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText style={styles.label}>Dwell Time</ThemedText>
          <ThemedText>{settings.dwellTime}s</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText>Notifications</ThemedText>
          <ThemedText style={{ color: settings.notificationsEnabled ? colors.success : colors.danger }}>
            {settings.notificationsEnabled ? "Enabled" : "Disabled"}
          </ThemedText>
        </View>
        <Button title="Test Notification" onPress={handleNotificationTest} variant="outline" />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Security</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.backgroundDefault, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => Alert.alert("Change Password", "This feature is coming soon!")}
        >
          <ThemedText>Change Password</ThemedText>
          <Feather name="chevron-right" size={20} color={colors.tabIconDefault} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.backgroundDefault, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => Alert.alert("Recovery Key", "Your recovery key is securely stored.")}
        >
          <ThemedText>View Recovery Key</ThemedText>
          <Feather name="chevron-right" size={20} color={colors.tabIconDefault} />
        </Pressable>
        <Button title="Export Data" onPress={handleExportData} variant="outline" />
        <Button title="Delete Account" onPress={handleDeleteAccount} variant="outline" />
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <ThemedText style={[styles.version, { color: colors.tabIconDefault }]}>
          Version 1.0.0
        </ThemedText>
        <ThemedText style={[styles.footer, { color: colors.tabIconDefault }]}>
          ReMind - Location-based reminders
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  lastSection: {
    paddingBottom: Spacing["5xl"],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  version: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  footer: {
    fontSize: 14,
    textAlign: "center",
  },
});
