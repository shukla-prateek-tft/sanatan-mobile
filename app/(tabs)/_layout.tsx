import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { FontAwesome5, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 80 : 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: colors.bgSecondary,
          borderBottomColor: colors.cardBorder,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: colors.gold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: "Sanatan Dharma",
        }}
      />
      <Tabs.Screen
        name="jap"
        options={{
          title: "Jap",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="infinite" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bhajan"
        options={{
          title: "Bhajan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scriptures"
        options={{
          title: "Scriptures",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kundli"
        options={{
          title: "Kundli",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="hand-sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
