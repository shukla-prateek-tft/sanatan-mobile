/**
 * app/(tabs)/_layout.tsx
 *
 * Shared header with HamburgerButton on the LEFT and app title centred.
 * The header is rendered once for all tabs — no per-screen setup needed.
 *
 * Header height accounts for the status bar so nothing overlaps.
 */

import { router, Tabs } from "expo-router";
import React, { useCallback } from "react";
import {
  Platform,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "@/components/SideBar";
import { useAppTheme } from "@/context/AppContext";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────
// SHARED HEADER
// ─────────────────────────────────────────────
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useAppTheme();
  const { t } = useTranslation();
  const navigate = useCallback(
    (href: string) => {
      setTimeout(() => router.push(href as any), 230);
    },
    [router],
  );
  return (
    <View
      style={[
        hdr.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: themeColors.bgSecondary,
          borderBottomColor: themeColors.cardBorder,
        },
      ]}
    >
      <View style={hdr.inner}>
        {/* LEFT — hamburger */}
        <View style={hdr.left}>
          <HamburgerButton />
        </View>
        {/* CENTER — title */}
        <View style={hdr.center}>
          <Text
            style={[hdr.title, { color: themeColors.gold }]}
            numberOfLines={1}
          >
            {t("appName")}
          </Text>
          <Text style={[hdr.subtitle, { color: themeColors.gold + "88" }]}>
            सनातन धर्म
          </Text>
        </View>
        {/* RIGHT — spacer (keeps title centred) */}
        <View style={hdr.right}>
          <TouchableOpacity
            onPress={() => navigate("/settings")}
            activeOpacity={0.72}
          >
            <Ionicons
              name={"settings-outline"}
              size={25}
              color={themeColors.gold}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
  },
  inner: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  left: { width: 56, alignItems: "flex-start" },
  center: { flex: 1, alignItems: "center" },
  right: { width: 35 },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});

// ─────────────────────────────────────────────
// TAB LAYOUT
// ─────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.gold,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: themeColors.bgSecondary,
          borderTopColor: themeColors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 72 : 58 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jap"
        options={{
          title: t("tabs.jap"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="infinite" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bhajan"
        options={{
          title: t("tabs.bhajan"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scriptures"
        options={{
          title: t("tabs.scriptures"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tabs.calendar"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="kundli" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="temples" options={{ href: null }} />
    </Tabs>
  );
}
