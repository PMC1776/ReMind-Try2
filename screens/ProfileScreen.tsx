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
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";
import * as Haptics from "expo-haptics";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { settings } = useReminders();

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

  const handleAdvancedSettings = () => {
    Haptics.selectionAsync();
    navigation.navigate("AdvancedSettings");
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
    <ScreenScrollView style={{ backgroundColor: colors.background }}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          <ThemedText style={[styles.label, { color: colors.tabIconDefault }]}>
            User ID: {user?.id}
          </ThemedText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={handleAdvancedSettings}
        >
          <ThemedText>Advanced Settings</ThemedText>
          <Feather name="chevron-right" size={20} color={colors.tabIconDefault} />
        </Pressable>
        <Button title="Archive" onPress={handleArchive} />
        <Button title="Logout" onPress={handleLogout} variant="outline" />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
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
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => Alert.alert("Change Password", "This feature is coming soon!")}
        >
          <ThemedText>Change Password</ThemedText>
          <Feather name="chevron-right" size={20} color={colors.tabIconDefault} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
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
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
