import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SuccessConfettiProps {
  show: boolean;
  onComplete: () => void;
  color?: "primary" | "orange" | "coral";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

const primaryColors = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE",
];

const orangeColors = [
  "#FF8C00", "#FFA500", "#FFB347", "#FF7F00",
  "#FFAA33", "#FF9933", "#FFB84D", "#FF8533",
];

const coralColors = [
  "#FF6B6B", "#FF8585", "#FF9999", "#E85555",
  "#FFA0A0", "#FFB8B8", "#FFD0D0", "#FFE5E5",
];

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function ConfettiParticle({ particle }: { particle: Particle }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.x, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.y, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    scale.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.scale, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withDelay(
      particle.delay * 1000,
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      particle.delay * 1000,
      withTiming(particle.rotation, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <AnimatedSvg width="20" height="20" viewBox="0 0 24 24">
        <Path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={particle.color}
        />
      </AnimatedSvg>
    </Animated.View>
  );
}

export default function SuccessConfetti({
  show,
  onComplete,
  color = "primary",
}: SuccessConfettiProps) {
  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);
  const containerOpacity = useSharedValue(0);

  const [particles, setParticles] = React.useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      // Reset animations
      checkScale.value = 0;
      ringScale.value = 1;
      ringOpacity.value = 0.5;
      containerOpacity.value = 0;

      // Fade in container
      containerOpacity.value = withTiming(1, { duration: 200 });

      // Animate checkmark with spring
      checkScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });

      // Pulse ring
      ringScale.value = withTiming(2, { duration: 600, easing: Easing.out(Easing.quad) });
      ringOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });

      // Generate particles
      const colors = color === "orange" ? orangeColors : color === "coral" ? coralColors : primaryColors;
      const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => {
        const angle = (i / 40) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          scale: Math.random() * 0.5 + 0.5,
          delay: Math.random() * 0.2,
        };
      });
      setParticles(newParticles);

      // Auto-dismiss
      const timer = setTimeout(() => {
        containerOpacity.value = withTiming(
          0,
          { duration: 300 },
          (finished) => {
            if (finished) {
              runOnJS(onComplete)();
            }
          }
        );
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, color]);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!show) return null;

  const bgColor = color === "orange" ? "#F97316" : color === "coral" ? "#FF6B6B" : "#3B82F6";
  const borderColor = color === "orange" ? "#F97316" : color === "coral" ? "#FF6B6B" : "#3B82F6";

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <View style={styles.center}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.ring,
            ringStyle,
            { borderColor },
          ]}
        />

        {/* Checkmark circle */}
        <Animated.View style={[styles.checkCircle, { backgroundColor: bgColor }, checkmarkStyle]}>
          <Feather name="check" size={64} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>

        {/* Confetti particles */}
        {particles.map((particle) => (
          <ConfettiParticle key={particle.id} particle={particle} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 10,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    zIndex: 5,
  },
  particle: {
    position: "absolute",
    zIndex: 1,
  },
});
