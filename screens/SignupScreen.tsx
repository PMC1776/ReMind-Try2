import React, { useState } from "react";
import { View, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { ScreenKeyboardAwareScrollView } from "../components/ScreenKeyboardAwareScrollView";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Spacing } from "../constants/theme";
import { authAPI } from "../utils/api";
import { generateKeypair, saveKeys } from "../utils/encryption";
import { validatePasswordStrength, hashPassword } from "../utils/passwordHash";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AuthStackNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { setNeedsVerification, setNeedsRecoveryKey } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return "weak";
    const validation = validatePasswordStrength(pass);
    return validation.strength;
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      Alert.alert(
        "Weak Password",
        "Your password must meet the following requirements:\n\n" + validation.errors.join("\n")
      );
      return;
    }

    setLoading(true);
    try {
      const keys = await generateKeypair();
      await saveKeys(keys);

      // Hash password before sending to server
      const hashedPassword = await hashPassword(password, email);

      const response = await authAPI.signup(email, hashedPassword, keys.publicKey);

      setNeedsVerification(true);
      setNeedsRecoveryKey(true);
      navigation.navigate("EmailVerification");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <ScreenKeyboardAwareScrollView
      style={{ backgroundColor: colors.backgroundRoot }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.title}>Create Account</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Your data is encrypted end-to-end{"\n"}
          Password requirements: 12+ characters, uppercase, lowercase, number, special character
        </ThemedText>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="your@email.com"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Choose a password"
        />

        {password ? (
          <View style={styles.strengthContainer}>
            <ThemedText style={[styles.strengthText, { color: colors.tabIconDefault }]}>
              Password strength:{" "}
              <ThemedText
                style={{
                  color:
                    strength === "very-strong"
                      ? colors.success
                      : strength === "strong"
                      ? colors.success
                      : strength === "medium"
                      ? colors.orange
                      : colors.danger,
                }}
              >
                {strength}
              </ThemedText>
            </ThemedText>
          </View>
        ) : null}

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm your password"
        />

        <Button
          title={loading ? "Creating account..." : "Create Account"}
          onPress={handleSignup}
          disabled={loading}
          style={styles.button}
        />

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        <Button
          title="Already have an account? Login"
          onPress={() => navigation.navigate("Login")}
          variant="text"
        />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  strengthContainer: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  strengthText: {
    fontSize: 14,
  },
  button: {
    marginTop: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.lg,
  },
});
