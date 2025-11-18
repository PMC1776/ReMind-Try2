import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { loadKeys } from "../utils/encryption";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AuthStackNavigator";
import Checkbox from "expo-checkbox";

type Props = NativeStackScreenProps<AuthStackParamList, "RecoveryKey">;

export default function RecoveryKeyScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { login, setNeedsRecoveryKey } = useAuth();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecoveryKey();
  }, []);

  const loadRecoveryKey = async () => {
    try {
      const keys = await loadKeys();
      if (keys) {
        setRecoveryKey(keys.privateKey);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load recovery key");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await Share.share({
        message: `ReMind Recovery Key\n\nIMPORTANT: Keep this key safe! You'll need it to recover your account if you lose access.\n\nRecovery Key:\n${recoveryKey}\n\nDo not share this key with anyone.`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleContinue = () => {
    if (!confirmed) {
      Alert.alert("Confirmation Required", "Please confirm you've saved your recovery key");
      return;
    }

    setNeedsRecoveryKey(false);
    // Navigate to login screen after saving recovery key
    navigation.replace("Login");
  };

  if (loading) {
    return null;
  }

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Feather name="shield" size={64} color={colors.primary} />
          <ThemedText style={styles.title}>Save Your Recovery Key</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            You'll need this key if you ever lose access to your account
          </ThemedText>
        </View>

        <View style={[styles.keyContainer, { backgroundColor: colors.backgroundDefault }]}>
          <ThemedText style={[styles.keyLabel, { color: colors.tabIconDefault }]}>
            Recovery Key
          </ThemedText>
          <ThemedText style={[styles.key, { fontFamily: Fonts.mono }]}>
            {recoveryKey}
          </ThemedText>
        </View>

        <View style={styles.warningContainer}>
          <Feather name="alert-triangle" size={20} color={colors.orange} />
          <ThemedText style={[styles.warning, { color: colors.orange }]}>
            Store this key in a secure location. ReMind cannot recover your encrypted data without it.
          </ThemedText>
        </View>

        <Button
          title="Download Recovery Key"
          onPress={handleDownload}
          icon={<Feather name="download" size={20} color="#FFFFFF" />}
          style={styles.button}
        />

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={confirmed}
            onValueChange={setConfirmed}
            color={confirmed ? colors.primary : undefined}
          />
          <ThemedText style={styles.checkboxLabel}>
            I've saved my recovery key in a secure location
          </ThemedText>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!confirmed}
          style={styles.button}
        />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  keyContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing["2xl"],
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  key: {
    fontSize: 14,
    lineHeight: 24,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing["2xl"],
  },
  warning: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.md,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  checkboxLabel: {
    fontSize: 14,
    marginLeft: Spacing.md,
    flex: 1,
  },
});
