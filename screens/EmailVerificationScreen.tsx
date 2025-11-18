import React, { useState, useRef } from "react";
import { View, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { ScreenKeyboardAwareScrollView } from "../components/ScreenKeyboardAwareScrollView";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Spacing, BorderRadius } from "../constants/theme";
import { authAPI } from "../utils/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AuthStackNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailVerification">;

export default function EmailVerificationScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { needsRecoveryKey, setNeedsVerification, login } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[0];
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    // Rate limiting: max 5 verification attempts
    if (verificationAttempts >= 5) {
      Alert.alert(
        "Too Many Attempts",
        "You've exceeded the maximum number of verification attempts. Please request a new code."
      );
      setCode(["", "", "", "", "", ""]);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyEmail(verificationCode);
      setNeedsVerification(false);
      setVerificationAttempts(0); // Reset on success

      if (needsRecoveryKey) {
        navigation.navigate("RecoveryKey");
      } else {
        await login(response.token, response.user);
      }
    } catch (error: any) {
      setVerificationAttempts((prev) => prev + 1);
      const remainingAttempts = 5 - (verificationAttempts + 1);

      if (remainingAttempts > 0) {
        Alert.alert(
          "Verification Failed",
          `Invalid code. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`
        );
      } else {
        Alert.alert(
          "Too Many Attempts",
          "You've used all verification attempts. Please request a new code."
        );
      }
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // Rate limiting: max 3 resend attempts
    if (resendAttempts >= 3) {
      Alert.alert(
        "Too Many Requests",
        "You've exceeded the maximum number of resend attempts. Please try again later."
      );
      return;
    }

    setResending(true);
    try {
      await authAPI.resendVerification();
      setResendAttempts((prev) => prev + 1);
      setVerificationAttempts(0); // Reset verification attempts on new code
      Alert.alert("Success", "Verification code sent to your email");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView
      style={{ backgroundColor: colors.backgroundRoot }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.content}>
        <ThemedText style={styles.title}>Verify Your Email</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Enter the 6-digit code sent to your email
        </ThemedText>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.backgroundDefault,
                  color: colors.text,
                  borderColor: digit ? colors.primary : colors.border,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title={loading ? "Verifying..." : "Verify"}
          onPress={handleVerify}
          disabled={loading}
          style={styles.button}
        />

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        <Button
          title={resending ? "Resending..." : "Resend Code"}
          onPress={handleResend}
          disabled={resending}
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.xs,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 2,
  },
  button: {
    marginTop: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.lg,
  },
});
