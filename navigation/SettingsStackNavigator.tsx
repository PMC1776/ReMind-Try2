import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import ArchiveScreen from "@/screens/ArchiveScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type SettingsStackParamList = {
  Settings: undefined;
  Archive: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Settings"
        component={ProfileScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{
          title: "Archive",
        }}
      />
    </Stack.Navigator>
  );
}
