import React from "react";
import { View, StyleSheet, Modal, Pressable, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import * as Haptics from "expo-haptics";

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant: "cancel" | "delete";
}

function ActionButton({ label, onPress, variant }: ActionButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const backgroundColor = variant === "delete" ? colors.danger : colors.surfaceSecondary;
  const textColor = variant === "delete" ? colors.buttonText : colors.textPrimary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.actionButton,
        { backgroundColor },
        animatedStyle,
      ]}
    >
      <ThemedText style={[styles.actionButtonText, { color: textColor }]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Reminder",
  message = "Are you sure you want to permanently delete this reminder?",
}: DeleteConfirmationModalProps) {
  const { colors } = useTheme();

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = () => {
    onClose();
    // Small delay to allow modal to close before action
    setTimeout(onConfirm, 200);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdropOverlay}
        />
      </Pressable>

      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          entering={FadeIn.duration(250).delay(50)}
          exiting={FadeOut.duration(150)}
          style={[styles.modal, { backgroundColor: colors.surface }]}
        >
          {/* Warning Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
            <Feather name="alert-triangle" size={32} color={colors.danger} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
              {message}
            </ThemedText>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <ActionButton label="Cancel" onPress={onClose} variant="cancel" />
            <ActionButton label="Delete" onPress={handleConfirm} variant="delete" />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 2,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
