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

interface OptionButtonProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  variant?: "default" | "destructive";
}

function OptionButton({ label, icon, onPress, variant = "default" }: OptionButtonProps) {
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

  const backgroundColor = variant === "destructive" ? colors.danger : colors.primary;
  const textColor = colors.buttonText;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.optionButton,
        { backgroundColor },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={20} color={textColor} />
      <ThemedText style={[styles.optionButtonText, { color: textColor }]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface ReminderOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isArchived: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}

export function ReminderOptionsModal({
  isOpen,
  onClose,
  title,
  subtitle,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: ReminderOptionsModalProps) {
  const { colors } = useTheme();

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleOptionPress = (action: () => void) => {
    onClose();
    // Small delay to allow modal to close before action
    setTimeout(action, 200);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              {subtitle && (
                <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                  {subtitle}
                </ThemedText>
              )}
            </View>
            <TouchableOpacity
              onPress={handleBackdropPress}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={24} color={colors.tabIconDefault} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {!isArchived && onEdit && (
              <OptionButton
                label="Edit"
                icon="edit-2"
                onPress={() => handleOptionPress(onEdit)}
              />
            )}
            {!isArchived && onArchive && (
              <OptionButton
                label="Archive"
                icon="archive"
                onPress={() => handleOptionPress(onArchive)}
              />
            )}
            {isArchived && onRestore && (
              <OptionButton
                label="Restore"
                icon="refresh-cw"
                onPress={() => handleOptionPress(onRestore)}
              />
            )}
            <OptionButton
              label="Delete"
              icon="trash-2"
              variant="destructive"
              onPress={() => handleOptionPress(onDelete)}
            />
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleBackdropPress}
            style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
