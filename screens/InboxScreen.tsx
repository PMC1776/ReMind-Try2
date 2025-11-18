import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { useTheme } from "../hooks/useTheme";
import { useReminders } from "../hooks/useReminders";
import { Spacing, BorderRadius } from "../constants/theme";
import * as Haptics from "expo-haptics";
import { formatDistanceToNow } from "date-fns";

export default function InboxScreen() {
  const { colors } = useTheme();
  const { triggeredReminders, dismissTriggered, clearAllTriggered } = useReminders();

  const handleDismiss = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dismissTriggered(id);
  };

  const handleClearAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearAllTriggered();
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      {triggeredReminders.length === 0 ? (
        <EmptyState
          image={require("../assets/illustrations/empty-inbox.png")}
          title="You're all caught up!"
          subtitle="No active reminders to review"
        />
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={styles.count}>
              {triggeredReminders.length} {triggeredReminders.length === 1 ? "reminder" : "reminders"}
            </ThemedText>
            <Button title="Clear All" onPress={handleClearAll} variant="text" />
          </View>

          <View style={styles.content}>
            {triggeredReminders.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleDismiss(item.id)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: colors.backgroundDefault,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.itemHeader}>
                  <ThemedText style={styles.task}>{item.task}</ThemedText>
                  <Feather name="x" size={20} color={colors.tabIconDefault} />
                </View>

                <View style={styles.itemDetails}>
                  <Feather name="map-pin" size={14} color={colors.tabIconDefault} />
                  <ThemedText style={[styles.location, { color: colors.tabIconDefault }]}>
                    {item.locationName}
                  </ThemedText>
                  <View
                    style={[
                      styles.triggerBadge,
                      {
                        backgroundColor:
                          item.trigger === "arriving"
                            ? colors.primary + "20"
                            : colors.orange + "20",
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.triggerText,
                        {
                          color: item.trigger === "arriving" ? colors.primary : colors.orange,
                        },
                      ]}
                    >
                      {item.trigger === "arriving" ? "ARRIVING" : "LEAVING"}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.time, { color: colors.tabIconDefault }]}>
                  {formatDistanceToNow(new Date(item.triggeredAt), { addSuffix: true })}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  count: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  item: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  task: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: 14,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  triggerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 10,
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
  },
});
