import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapViewScreen from "@/screens/MapViewScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type MapStackParamList = {
  MapView: undefined;
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
