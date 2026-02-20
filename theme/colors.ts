// Dark Temple Theme Colors - Deep Maroon & Gold Aesthetic

export const colors = {
  // Primary Temple Colors
  primary: "#8B0000", // Deep maroon
  primaryDark: "#4A0E0E", // Darker maroon for backgrounds
  primaryLight: "#A52A2A", // Lighter maroon for highlights

  // Sacred Gold Accent
  gold: "#D4AF37", // Rich gold
  goldLight: "#FFD700", // Bright gold for glow effects
  goldDark: "#B8860B", // Dark gold for subtle accents

  // Background Gradients
  bgPrimary: "#1A0A0A", // Very dark maroon-black
  bgSecondary: "#2D1414", // Dark maroon
  bgTertiary: "#3D1F1F", // Medium dark maroon

  // Text Colors
  textPrimary: "#FFF8DC", // Cornsilk - warm white
  textSecondary: "#D4AF37", // Gold for emphasis
  textMuted: "#B8A594", // Muted beige
  textInverse: "#1A0A0A", // Dark text on light backgrounds

  // UI Elements
  cardBg: "#2D1414CC", // Semi-transparent dark maroon
  cardBorder: "#D4AF3733", // Subtle gold border
  divider: "#D4AF3722", // Very subtle gold divider

  // Status Colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Overlay & Shadow
  overlay: "#00000080", // Semi-transparent black
  shadow: "#00000040", // Shadow
  glow: "#D4AF3740", // Gold glow

  // Special Effects
  diyaFlame: "#FF6B00", // Orange flame
  diyaGlow: "#FFA50080", // Orange glow
  moonLight: "#E8E8E8", // Moon color

  // Transparent
  transparent: "transparent",
};

export type ColorKey = keyof typeof colors;
