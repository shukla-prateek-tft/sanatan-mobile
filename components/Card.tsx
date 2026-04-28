import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, spacing, typography, theme } from "../theme";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/context/AppContext";
import { ThemeColors } from "@/theme/themes";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  title,
  subtitle,
}) => {
  const { themeColors: colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      ...theme.shadows.md,
    },
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.fontSize.md,
      color: colors.textMuted,
    },
  });
