import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InboxScreen from "@/screens/InboxScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type InboxStackParamList = {
  Inbox: undefined;
};

const Stack = createNativeStackNavigator<InboxStackParamList>();

export default function InboxStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: "Inbox",
        }}
      />
    </Stack.Navigator>
  );
}
