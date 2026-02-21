import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { Card } from "../../components/Card";
import { colors, spacing, typography } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const DEV = {
  name: "Prateek Shukla",
  nameHi: "प्रतीक शुक्ल",
  role: "Full Stack Developer",
  roleHi: "सॉफ्टवेयर डेवलपर",
  email: "prateekshukla130@gmail.com",
  website: "https://portfolio-15a4a.web.app/",
  linkedin: "https://www.linkedin.com/in/prateek-shukla-b61050215/",
  location: "India 🇮🇳",
  locationHi: "भारत 🇮🇳",
  bio: "Built with devotion for the Sanatan Dharma community. Open to feedback, contributions, and blessings 🙏",
  bioHi:
    "सनातन धर्म समुदाय के लिए भक्तिभाव से निर्मित। प्रतिक्रिया, योगदान और आशीर्वाद का स्वागत है 🙏",
};

async function openLink(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("त्रुटि · Error", `Cannot open: ${url}`);
  } catch {
    Alert.alert("त्रुटि · Error", "Could not open link.");
  }
}

function openEmail() {
  const subject = encodeURIComponent("Panchang App Feedback");
  const body = encodeURIComponent("Namaste,\n\n");
  openLink(`mailto:${DEV.email}?subject=${subject}&body=${body}`);
}

// ─── Bilingual link row ──────────────────────
const LinkRow = ({
  icon,
  labelEn,
  labelHi,
  sub,
  onPress,
  iconColor,
}: {
  icon: string;
  labelEn: string;
  labelHi: string;
  sub?: string;
  onPress: () => void;
  iconColor?: string;
}) => (
  <TouchableOpacity style={st.linkRow} onPress={onPress} activeOpacity={0.72}>
    <View
      style={[
        st.linkIconBox,
        { backgroundColor: (iconColor ?? colors.gold) + "18" },
      ]}
    >
      <Ionicons name={icon as any} size={20} color={iconColor ?? colors.gold} />
    </View>
    <View style={st.linkText}>
      <View style={st.linkLabelRow}>
        <Text style={st.linkLabelEn}>{labelEn}</Text>
        <Text style={st.linkLabelHi}>{labelHi}</Text>
      </View>
      {sub ? (
        <Text style={st.linkSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
    <Ionicons
      name="chevron-forward"
      size={16}
      color={colors.textMuted + "80"}
    />
  </TouchableOpacity>
);

// ─── Bilingual info row ──────────────────────
const InfoRow = ({
  icon,
  labelEn,
  labelHi,
  valueEn,
  valueHi,
}: {
  icon: string;
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
}) => (
  <View style={st.infoRow}>
    <Ionicons name={icon as any} size={22} color={colors.gold} />
    <View style={st.infoText}>
      <View style={st.infoLabelRow}>
        <Text style={st.infoLabelEn}>{labelEn}</Text>
        <Text style={st.infoLabelHi}>{labelHi}</Text>
      </View>
      <Text style={st.infoValueEn}>{valueEn}</Text>
      {valueHi ? <Text style={st.infoValueHi}>{valueHi}</Text> : null}
    </View>
  </View>
);

// ─── Card section title override ────────────
const SectionTitle = ({ en, hi }: { en: string; hi: string }) => (
  <View style={st.sectionTitleRow}>
    <Text style={st.sectionTitleEn}>{en}</Text>
    <Text style={st.sectionTitleHi}>{hi}</Text>
  </View>
);

export default function SettingsScreen() {
  return (
    <GradientBackground>
      <ScrollView
        style={st.container}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── ABOUT APP ── */}
        <Card title="🪔 About · परिचय">
          <InfoRow
            icon="information-circle"
            labelEn="App Version"
            labelHi="संस्करण"
            valueEn={Constants.expoConfig?.version ?? "1.0.0"}
          />
          <View style={st.divider} />
          <InfoRow
            icon="book"
            labelEn="Purpose"
            labelHi="उद्देश्य"
            valueEn="A spiritual companion for daily Hindu practices, Panchang, Bhajan & Scriptures"
            valueHi="हिंदू दैनिक पूजा, पञ्चाङ्ग, भजन और शास्त्रों के लिए आध्यात्मिक सहायक"
          />
          <View style={st.divider} />
          <InfoRow
            icon="heart"
            labelEn="Made with"
            labelHi="निर्माण"
            valueEn="Devotion and dedication to Sanatan Dharma"
            valueHi="सनातन धर्म के प्रति भक्ति और समर्पण से"
          />
          <View style={st.divider} />
          <InfoRow
            icon="location"
            labelEn="Origin"
            labelHi="देश"
            valueEn={DEV.location}
            valueHi={DEV.locationHi}
          />
        </Card>

        {/* ── DEVELOPER ── */}
        <Card title="👨‍💻 Developer · डेवलपर">
          <View style={st.devProfile}>
            <View style={st.devAvatar}>
              <Text style={st.devAvatarText}>🧑‍💻</Text>
            </View>
            <View style={st.devInfo}>
              <Text style={st.devName}>{DEV.name}</Text>
              <Text style={st.devNameHi}>{DEV.nameHi}</Text>
              <View style={st.devRolePill}>
                <Text style={st.devRoleEn}>{DEV.role}</Text>
                <Text style={st.devRoleHi}>{DEV.roleHi}</Text>
              </View>
            </View>
          </View>

          {/* Bio bilingual */}
          <View style={st.bioBox}>
            <Text style={st.bioEn}>{DEV.bio}</Text>
            <Text style={st.bioHi}>{DEV.bioHi}</Text>
          </View>

          <View style={st.divider} />

          <LinkRow
            icon="mail"
            labelEn="Send Email"
            labelHi="ईमेल करें"
            sub={DEV.email}
            onPress={openEmail}
            iconColor="#EA4335"
          />
          <LinkRow
            icon="globe-outline"
            labelEn="Website / Portfolio"
            labelHi="वेबसाइट"
            sub={DEV.website}
            onPress={() => openLink(DEV.website)}
            iconColor={colors.gold}
          />
          <LinkRow
            icon="logo-linkedin"
            labelEn="LinkedIn"
            labelHi="लिंक्डइन"
            sub={DEV.linkedin}
            onPress={() => openLink(DEV.linkedin)}
            iconColor="#0A66C2"
          />
        </Card>

        {/* ── FEEDBACK ── */}
        <Card title="💬 Feedback · प्रतिक्रिया">
          <LinkRow
            icon="mail-outline"
            labelEn="Send Feedback"
            labelHi="प्रतिक्रिया भेजें"
            sub="Report a bug or suggest a feature · बग रिपोर्ट या सुझाव"
            onPress={openEmail}
            iconColor={colors.gold}
          />
          <LinkRow
            icon="star-outline"
            labelEn="Rate the App"
            labelHi="ऐप को रेटिंग दें"
            sub="Your rating helps others find this app · आपकी रेटिंग दूसरों की मदद करती है"
            onPress={() => openLink("https://play.google.com/store")}
            iconColor="#F59E0B"
          />
          <LinkRow
            icon="share-social-outline"
            labelEn="Share App"
            labelHi="ऐप शेयर करें"
            sub="Share with family and friends · परिवार और मित्रों के साथ साझा करें"
            onPress={() =>
              Share.share({
                title: "Panchang — Daily Hindu Calendar",
                message: `🪔 Jai Shri Ram!\n\nI use this beautiful Panchang app for daily Hindu calendar, bhajans, mantras & Gita.\n\nDownload: ${DEV.website}`,
                url: DEV.website,
              })
            }
            iconColor="#22C55E"
          />
        </Card>

        {/* ── FOOTER ── */}
        <View style={st.footer}>
          <Text style={st.footerOm}>ॐ</Text>
          <Text style={st.footerMain}>Har Har Mahadev</Text>
          <Text style={st.footerSub}>हर हर महादेव</Text>
          <Text style={st.footerMantra}>॥ सर्वे भवन्तु सुखिनः ॥</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // Section title (inside card)
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitleEn: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionTitleHi: { fontSize: 13, color: colors.gold },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  infoText: { flex: 1, marginLeft: spacing.md },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 3,
  },
  infoLabelEn: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoLabelHi: { fontSize: 11, color: colors.gold + "AA" },
  infoValueEn: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.md * 1.5,
  },
  infoValueHi: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },

  // Link row
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "60",
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  linkText: { flex: 1 },
  linkLabelRow: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  linkLabelEn: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  linkLabelHi: { fontSize: 11, color: colors.gold + "BB" },
  linkSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Dev profile
  devProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  devAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold + "20",
    borderWidth: 2,
    borderColor: colors.gold + "50",
    alignItems: "center",
    justifyContent: "center",
  },
  devAvatarText: { fontSize: 28 },
  devInfo: { flex: 1 },
  devName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  devNameHi: { fontSize: 13, color: colors.gold, marginBottom: 6 },
  devRolePill: {
    backgroundColor: colors.gold + "18",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.gold + "40",
  },
  devRoleEn: { fontSize: 11, color: colors.gold, fontWeight: "600" },
  devRoleHi: { fontSize: 10, color: colors.gold + "99", marginTop: 1 },

  // Bio box
  bioBox: {
    backgroundColor: colors.gold + "0A",
    borderRadius: 10,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold + "50",
    marginBottom: spacing.sm,
  },
  bioEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  bioHi: { fontSize: 12, color: colors.textMuted, lineHeight: 19 },

  // Footer
  footer: { alignItems: "center", paddingVertical: spacing.xl, gap: 4 },
  footerOm: { fontSize: typography.fontSize.display, color: colors.gold },
  footerMain: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
  footerSub: { fontSize: typography.fontSize.md, color: colors.gold + "CC" },
  footerMantra: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
