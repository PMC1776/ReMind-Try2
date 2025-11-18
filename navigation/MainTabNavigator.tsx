import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import MapStackNavigator from "@/navigation/MapStackNavigator";
import ListStackNavigator from "@/navigation/ListStackNavigator";
import InboxStackNavigator from "@/navigation/InboxStackNavigator";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import AddReminderSheet from "@/components/AddReminderSheet";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";

export type MainTabParamList = {
  MapTab: undefined;
  ListTab: undefined;
  AddTab: undefined;
  InboxTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom colors from Tailwind design
// HSL(180, 20%, 80%) -> light teal background
const PMC_80BG = "#BFD9D9";
// HSL(180, 20%, 55%) -> medium teal for accent
const PMC_55BG = "#70A3A3";

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAddReminderOpen(true);
  };

  const handleSaveReminder = (reminder: any) => {
    console.log("Reminder saved:", reminder);
    // TODO: Save to backend
  };

  return (
    <>
    <Tab.Navigator
      initialRouteName="MapTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          height: 56,
          backgroundColor: PMC_80BG,
          borderTopWidth: 0,
          elevation: 0,
          paddingHorizontal: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="ListTab"
        component={ListStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Feather name="list" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="AddTab"
        component={View}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleAddPress();
          },
        }}
        options={{
          tabBarIcon: () => (
            <View
              style={[
                styles.addButton,
                {
                  backgroundColor: PMC_55BG,
                  borderColor: PMC_55BG,
                },
              ]}
            >
              <Feather name="plus" size={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="InboxTab"
        component={InboxStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Feather name="mail" size={24} color={color} />,
          tabBarBadge: undefined, // Can be set dynamically for unread count
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>

    <AddReminderSheet
      isOpen={isAddReminderOpen}
      onClose={() => setIsAddReminderOpen(false)}
      onSave={handleSaveReminder}
    />
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
