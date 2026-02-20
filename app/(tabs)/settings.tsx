import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { Card } from "../../components/Card";
import { colors, spacing, typography, theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

export default function SettingsScreen() {
  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        {/* About */}
        <Card title="About">
          <View style={styles.aboutItem}>
            <Ionicons name="information-circle" size={24} color={colors.gold} />
            <View style={styles.aboutText}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>
                {Constants.expoConfig?.version || "1.0.0"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutItem}>
            <Ionicons name="book" size={24} color={colors.gold} />
            <View style={styles.aboutText}>
              <Text style={styles.aboutLabel}>Purpose</Text>
              <Text style={styles.aboutValue}>
                A spiritual companion for daily Hindu practices, Panchang, and
                scriptures
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutItem}>
            <Ionicons name="heart" size={24} color={colors.gold} />
            <View style={styles.aboutText}>
              <Text style={styles.aboutLabel}>Made with</Text>
              <Text style={styles.aboutValue}>
                Devotion and dedication to Sanatan Dharma
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact */}
        <Card title="Contact">
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="mail" size={20} color={colors.gold} />
            <Text style={styles.contactButtonText}>Send Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="globe" size={20} color={colors.gold} />
            <Text style={styles.contactButtonText}>Visit Website</Text>
          </TouchableOpacity>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ॐ</Text>
          <Text style={styles.footerSubtext}>Har Har Mahadev</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  aboutText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  aboutLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  aboutValue: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  contactButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.display,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  footerSubtext: {
    fontSize: typography.fontSize.lg,
    color: colors.textMuted,
  },
});
