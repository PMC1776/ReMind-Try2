import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListViewScreen from "@/screens/ListViewScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ListStackParamList = {
  ListView: undefined;
};

const Stack = createNativeStackNavigator<ListStackParamList>();

export default function ListStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="ListView"
        component={ListViewScreen}
        options={{
          title: "Reminders",
        }}
      />
    </Stack.Navigator>
  );
}
