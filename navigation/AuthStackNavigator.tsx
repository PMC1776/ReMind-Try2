import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import EmailVerificationScreen from "@/screens/EmailVerificationScreen";
import RecoveryKeyScreen from "@/screens/RecoveryKeyScreen";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailVerification: undefined;
  RecoveryKey: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="RecoveryKey" component={RecoveryKeyScreen} />
    </Stack.Navigator>
  );
}
