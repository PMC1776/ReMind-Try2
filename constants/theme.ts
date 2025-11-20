import { Platform } from "react-native";

// Primary accent colors - ReMind signature coral
const coral = "#FF6B6B";
const coralDark = "#E85555";
const coralLight = "#FFE5E5";

export const Colors = {
  light: {
    // Primary colors
    coral: coral,
    coralDark: coralDark,
    coralLight: coralLight,
    primary: coral, // Primary action color
    link: coral,

    // Text colors
    text: "#1A1A1A", // Primary text
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B", // Labels and subtext
    textTertiary: "#999999", // Placeholder text
    buttonText: "#FFFFFF",

    // Tab/Icon colors
    tabIconDefault: "#6B6B6B",
    tabIconSelected: coral,

    // Background colors
    background: "#FFF8F6", // Main app background (peachy-cream)
    backgroundRoot: "#FFFFFF", // Surface/cards
    backgroundDefault: "#FFF8F6", // Main app background
    backgroundSecondary: "#F5F5F5", // Unselected pills/buttons
    backgroundTertiary: "#D9D9D9",
    surface: "#FFFFFF", // Modal/card backgrounds
    surfaceSecondary: "#F5F5F5",

    // Borders & dividers
    border: "#E8E8E8",
    disabled: "#C4C4C4",

    // Supporting colors
    success: "#4CAF50",
    danger: "#DC3545", // Destructive actions
    destructive: "#DC3545",
    infoBackground: "#F0F9FF",
  },
  dark: {
    // Primary colors
    coral: coral,
    coralDark: coralDark,
    coralLight: coralLight,
    primary: coral,
    link: coral,

    // Text colors
    text: "#F9FAFB",
    textPrimary: "#F9FAFB",
    textSecondary: "#9BA1A6",
    textTertiary: "#6B6B6B",
    buttonText: "#FFFFFF",

    // Tab/Icon colors
    tabIconDefault: "#9BA1A6",
    tabIconSelected: coral,

    // Background colors
    background: "#1F2937",
    backgroundRoot: "#1F2937",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    surface: "#1F2937",
    surfaceSecondary: "#353739",

    // Borders & dividers
    border: "#374151",
    disabled: "#6B6B6B",

    // Supporting colors
    success: "#4CAF50",
    danger: "#DC3545",
    destructive: "#DC3545",
    infoBackground: "#1F2937",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
