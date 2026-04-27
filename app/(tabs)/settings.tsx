import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Switch,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { spacing, typography } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useNotifications } from "../../services/useNotification";
import type { NotificationPrefs } from "../../services/notificationService";
import { useAppTheme } from "@/context/AppContext";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/services/i18n";
import { AppTheme, THEME_GRADIENTS, THEME_ACCENT_COLORS } from "@/theme/themes";
import { LinearGradient } from "expo-linear-gradient";

// ─────────────────────────────────────────────
// DEVELOPER INFO (compact)
// ─────────────────────────────────────────────
const DEV = {
  name: "Prateek Shukla",
  nameHi: "प्रतीक शुक्ल",
  role: "Full Stack Developer",
  email: "prateekshukla130@gmail.com",
  website: "https://portfolio-15a4a.web.app/",
  linkedin: "https://www.linkedin.com/in/prateek-shukla-b61050215/",
};

const THEMES: { key: AppTheme; gradient: [string, string, string]; accent: string }[] = [
  { key: 'maroon', gradient: THEME_GRADIENTS.maroon, accent: THEME_ACCENT_COLORS.maroon },
  { key: 'saffron', gradient: THEME_GRADIENTS.saffron, accent: THEME_ACCENT_COLORS.saffron },
  { key: 'lotus', gradient: THEME_GRADIENTS.lotus, accent: THEME_ACCENT_COLORS.lotus },
  { key: 'ocean', gradient: THEME_GRADIENTS.ocean, accent: THEME_ACCENT_COLORS.ocean },
  { key: 'forest', gradient: THEME_GRADIENTS.forest, accent: THEME_ACCENT_COLORS.forest },
];

async function openLink(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Error", `Cannot open: ${url}`);
  } catch {
    Alert.alert("Error", "Could not open link.");
  }
}

// ─────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────
const Divider = ({ color }: { color: string }) => (
  <View style={[st.divider, { backgroundColor: color }]} />
);

const SectionHeader = ({ icon, label, gold }: { icon: string; label: string; gold: string }) => (
  <View style={st.sectionHeader}>
    <View style={[st.sectionHeaderIcon, { backgroundColor: gold + '18' }]}>
      <Ionicons name={icon as any} size={15} color={gold} />
    </View>
    <Text style={[st.sectionHeaderLabel, { color: gold }]}>{label}</Text>
  </View>
);

const ToggleRow = ({
  icon,
  iconColor,
  label,
  sub,
  value,
  onValueChange,
  disabled,
  colors,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  colors: any;
}) => (
  <View style={[st.toggleRow, disabled && { opacity: 0.45 }]}>
    <View style={[st.toggleIcon, { backgroundColor: (iconColor ?? colors.gold) + "18" }]}>
      <Ionicons name={icon as any} size={18} color={iconColor ?? colors.gold} />
    </View>
    <View style={st.toggleLabels}>
      <Text style={[st.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
      {sub ? <Text style={[st.toggleSub, { color: colors.textMuted }]}>{sub}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={disabled ? undefined : onValueChange}
      trackColor={{ false: colors.cardBorder, true: colors.gold + "80" }}
      thumbColor={value ? colors.gold : colors.textMuted}
      ios_backgroundColor={colors.cardBorder}
    />
  </View>
);

const TimeRow = ({
  icon,
  label,
  hour,
  minute,
  onPress,
  visible,
  colors,
}: {
  icon: string;
  label: string;
  hour: number;
  minute: number;
  onPress: () => void;
  visible: boolean;
  colors: any;
}) => {
  if (!visible) return null;
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return (
    <TouchableOpacity
      style={[st.timeRow, { backgroundColor: colors.gold + "0A", borderColor: colors.gold + "25" }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon as any} size={16} color={colors.textMuted} />
      <Text style={[st.timeRowLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[st.timePill, { backgroundColor: colors.gold + "18" }]}>
        <Text style={[st.timePillTxt, { color: colors.gold }]}>
          {h}:{m}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={colors.gold} />
      </View>
    </TouchableOpacity>
  );
};

const LinkRow = ({
  icon,
  label,
  sub,
  onPress,
  iconColor,
  colors,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  iconColor?: string;
  colors: any;
}) => (
  <TouchableOpacity
    style={[st.linkRow, { borderBottomColor: colors.divider + "60" }]}
    onPress={onPress}
    activeOpacity={0.72}
  >
    <View style={[st.linkIconBox, { backgroundColor: (iconColor ?? colors.gold) + "18" }]}>
      <Ionicons name={icon as any} size={20} color={iconColor ?? colors.gold} />
    </View>
    <View style={st.linkText}>
      <Text style={[st.linkLabel, { color: colors.textPrimary }]}>{label}</Text>
      {sub ? (
        <Text style={[st.linkSub, { color: colors.textMuted }]} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted + "80"} />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// INLINE TIME PICKER MODAL
// ─────────────────────────────────────────────
interface TimePick {
  hour: number;
  minute: number;
}

const TimePickerModal = ({
  visible,
  initial,
  title,
  onConfirm,
  onClose,
  t,
  colors,
}: {
  visible: boolean;
  initial: TimePick;
  title: string;
  onConfirm: (t: TimePick) => void;
  onClose: () => void;
  t: (key: string) => string;
  colors: any;
}) => {
  const [h, setH] = useState(initial.hour);
  const [m, setM] = useState(initial.minute);
  const fmt = (n: number) => String(n).padStart(2, "0");
  const changeH = (delta: number) => setH((v) => (v + delta + 24) % 24);
  const changeM = (delta: number) => setM((v) => (v + delta + 60) % 60);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tp.overlay}>
        <View style={[tp.sheet, { backgroundColor: colors.bgSecondary, borderColor: colors.gold + "30" }]}>
          <Text style={[tp.title, { color: colors.gold }]}>{title}</Text>
          <View style={tp.pickers}>
            <View style={tp.wheel}>
              <TouchableOpacity onPress={() => changeH(1)} style={tp.arrow}>
                <Ionicons name="chevron-up" size={22} color={colors.gold} />
              </TouchableOpacity>
              <Text style={[tp.digit, { color: colors.textPrimary }]}>{fmt(h)}</Text>
              <TouchableOpacity onPress={() => changeH(-1)} style={tp.arrow}>
                <Ionicons name="chevron-down" size={22} color={colors.gold} />
              </TouchableOpacity>
              <Text style={[tp.unit, { color: colors.textMuted }]}>HH</Text>
            </View>
            <Text style={[tp.colon, { color: colors.gold }]}>:</Text>
            <View style={tp.wheel}>
              <TouchableOpacity onPress={() => changeM(5)} style={tp.arrow}>
                <Ionicons name="chevron-up" size={22} color={colors.gold} />
              </TouchableOpacity>
              <Text style={[tp.digit, { color: colors.textPrimary }]}>{fmt(m)}</Text>
              <TouchableOpacity onPress={() => changeM(-5)} style={tp.arrow}>
                <Ionicons name="chevron-down" size={22} color={colors.gold} />
              </TouchableOpacity>
              <Text style={[tp.unit, { color: colors.textMuted }]}>MM</Text>
            </View>
          </View>
          <View style={tp.actions}>
            <TouchableOpacity
              style={[tp.cancelBtn, { borderColor: colors.cardBorder }]}
              onPress={onClose}
            >
              <Text style={[tp.cancelTxt, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tp.confirmBtn, { backgroundColor: colors.gold }]}
              onPress={() => { onConfirm({ hour: h, minute: m }); onClose(); }}
            >
              <Text style={[tp.confirmTxt, { color: colors.bgSecondary }]}>{t('common.setTime')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// WEEKDAY PICKER
// ─────────────────────────────────────────────
const WeekdayPicker = ({
  selected,
  onChange,
  days,
  colors,
}: {
  selected: number;
  onChange: (d: number) => void;
  days: string[];
  colors: any;
}) => (
  <View style={st.weekdayRow}>
    {days.map((d, i) => (
      <TouchableOpacity
        key={i}
        style={[
          st.dayBtn,
          { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder },
          selected === i && { backgroundColor: colors.gold + "20", borderColor: colors.gold },
        ]}
        onPress={() => onChange(i)}
        activeOpacity={0.7}
      >
        <Text style={[st.dayBtnTxt, { color: selected === i ? colors.gold : colors.textMuted }]}>
          {d}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─────────────────────────────────────────────
// PERMISSION BANNER
// ─────────────────────────────────────────────
const PermissionBanner = ({
  onRequest,
  t,
  colors,
}: {
  onRequest: () => void;
  t: (key: string) => string;
  colors: any;
}) => (
  <TouchableOpacity style={st.permBanner} onPress={onRequest} activeOpacity={0.85}>
    <Ionicons name="notifications-off-outline" size={20} color="#F59E0B" />
    <View style={{ flex: 1, marginLeft: spacing.sm }}>
      <Text style={st.permBannerTitle}>{t('settings.notifications.permissionTitle')}</Text>
      <Text style={[st.permBannerSub, { color: colors.textMuted }]}>
        {t('settings.notifications.permissionSub')}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function SettingsScreen() {
  const { prefs, loading, permissionGranted, updatePref, requestPermission } = useNotifications();
  const { themeColors, themeKey, setTheme, language, setLanguage } = useAppTheme();
  const { t } = useTranslation();
  const colors = themeColors;

  const [timePicker, setTimePicker] = useState<{
    visible: boolean;
    key: keyof NotificationPrefs | null;
    title: string;
    current: { hour: number; minute: number };
  }>({ visible: false, key: null, title: "", current: { hour: 6, minute: 0 } });

  const openTimePicker = (
    key: keyof NotificationPrefs,
    title: string,
    current: { hour: number; minute: number },
  ) => setTimePicker({ visible: true, key, title, current });

  const handleTimeConfirm = (time: { hour: number; minute: number }) => {
    if (timePicker.key) updatePref(timePicker.key, time as any);
  };

  const DAYS_SHORT = [
    t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'),
    t('days.thu'), t('days.fri'), t('days.sat'),
  ];

  const cardStyle = [
    st.cardWrap,
    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
  ];

  const cardHeaderStyle = [
    st.cardHeader,
    { borderBottomColor: colors.cardBorder, backgroundColor: colors.gold + "08" },
  ];

  const cardTitleStyle = [st.cardTitle, { color: colors.gold }];

  return (
    <GradientBackground>
      <ScrollView
        style={st.container}
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════
            APPEARANCE — Language & Theme
        ══════════════════════════════════════ */}
        <View style={cardStyle}>
          <View style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>{t('settings.appearance.title')}</Text>
          </View>

          {/* ── LANGUAGE ── */}
          <SectionHeader
            icon="language-outline"
            label={t('settings.appearance.language')}
            gold={colors.gold}
          />
          <View style={st.langGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    st.langBtn,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder },
                    isActive && { backgroundColor: colors.gold + "20", borderColor: colors.gold },
                  ]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      st.langBtnText,
                      { color: isActive ? colors.gold : colors.textPrimary },
                    ]}
                  >
                    {lang.name}
                  </Text>
                  <Text style={[st.langBtnSub, { color: isActive ? colors.gold + "AA" : colors.textMuted }]}>
                    {lang.nativeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Divider color={colors.divider} />

          {/* ── THEME ── */}
          <SectionHeader
            icon="color-palette-outline"
            label={t('settings.appearance.theme')}
            gold={colors.gold}
          />
          <View style={st.themeGrid}>
            {THEMES.map(({ key, gradient, accent }) => {
              const isActive = themeKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    st.themeBtn,
                    isActive && { borderColor: colors.gold, borderWidth: 2.5 },
                    !isActive && { borderColor: colors.cardBorder },
                  ]}
                  onPress={() => setTheme(key)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradient}
                    style={st.themeBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[st.themeAccentDot, { backgroundColor: accent }]} />
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.gold} style={st.themeCheck} />
                    )}
                  </LinearGradient>
                  <Text style={[st.themeBtnLabel, { color: isActive ? colors.gold : colors.textMuted }]}>
                    {t(`themes.${key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ══════════════════════════════════════
            NOTIFICATIONS
        ══════════════════════════════════════ */}
        <View style={cardStyle}>
          <View style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>{t('settings.notifications.title')}</Text>
          </View>

          {loading && (
            <View style={st.loadingRow}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={[st.loadingTxt, { color: colors.textMuted }]}>
                {t('common.loading')}
              </Text>
            </View>
          )}

          {!loading && !permissionGranted && (
            <PermissionBanner onRequest={requestPermission} t={t} colors={colors} />
          )}

          {!loading && (
            <>
              {/* ── DAILY REMINDERS ── */}
              <SectionHeader
                icon="sunny-outline"
                label={t('settings.notifications.dailyReminders')}
                gold={colors.gold}
              />

              <ToggleRow
                icon="flower-outline"
                iconColor="#F59E0B"
                label={t('settings.notifications.morningPuja')}
                sub={t('settings.notifications.morningPujaSub')}
                value={prefs.morningPuja}
                onValueChange={(v) => updatePref("morningPuja", v)}
                colors={colors}
              />
              <TimeRow
                icon="time-outline"
                label={t('settings.notifications.time')}
                hour={prefs.morningPujaTime.hour}
                minute={prefs.morningPujaTime.minute}
                visible={prefs.morningPuja}
                onPress={() => openTimePicker("morningPujaTime", "🌅 " + t('settings.notifications.morningPuja'), prefs.morningPujaTime)}
                colors={colors}
              />

              <ToggleRow
                icon="flame-outline"
                iconColor="#EF4444"
                label={t('settings.notifications.eveningAarti')}
                sub={t('settings.notifications.eveningAartiSub')}
                value={prefs.eveningAarti}
                onValueChange={(v) => updatePref("eveningAarti", v)}
                colors={colors}
              />
              <TimeRow
                icon="time-outline"
                label={t('settings.notifications.time')}
                hour={prefs.eveningAartiTime.hour}
                minute={prefs.eveningAartiTime.minute}
                visible={prefs.eveningAarti}
                onPress={() => openTimePicker("eveningAartiTime", "🔔 " + t('settings.notifications.eveningAarti'), prefs.eveningAartiTime)}
                colors={colors}
              />

              <ToggleRow
                icon="sparkles-outline"
                iconColor="#8B5CF6"
                label={t('settings.notifications.dailyJap')}
                sub={t('settings.notifications.dailyJapSub')}
                value={prefs.dailyJap}
                onValueChange={(v) => updatePref("dailyJap", v)}
                colors={colors}
              />
              <TimeRow
                icon="time-outline"
                label={t('settings.notifications.time')}
                hour={prefs.dailyJapTime.hour}
                minute={prefs.dailyJapTime.minute}
                visible={prefs.dailyJap}
                onPress={() => openTimePicker("dailyJapTime", "📿 " + t('settings.notifications.dailyJap'), prefs.dailyJapTime)}
                colors={colors}
              />

              <Divider color={colors.divider} />

              {/* ── WEEKLY DEVOTION ── */}
              <SectionHeader
                icon="calendar-outline"
                label={t('settings.notifications.weeklyDevotion')}
                gold={colors.gold}
              />

              <ToggleRow
                icon="star-outline"
                iconColor="#F4D160"
                label={t('settings.notifications.weeklyDevotionReminder')}
                sub={t('settings.notifications.weeklyDevotionSub')}
                value={prefs.weeklyDevotion}
                onValueChange={(v) => updatePref("weeklyDevotion", v)}
                colors={colors}
              />

              {prefs.weeklyDevotion && (
                <>
                  <Text style={[st.pickerLabel, { color: colors.textMuted }]}>
                    {t('settings.notifications.daySelect')}
                  </Text>
                  <WeekdayPicker
                    selected={prefs.weeklyDevotionDay}
                    onChange={(d) => updatePref("weeklyDevotionDay", d)}
                    days={DAYS_SHORT}
                    colors={colors}
                  />
                  <TimeRow
                    icon="time-outline"
                    label={t('settings.notifications.time')}
                    hour={prefs.weeklyDevotionTime.hour}
                    minute={prefs.weeklyDevotionTime.minute}
                    visible={true}
                    onPress={() => openTimePicker("weeklyDevotionTime", "🙏 " + t('settings.notifications.weeklyDevotion'), prefs.weeklyDevotionTime)}
                    colors={colors}
                  />
                </>
              )}

              <Divider color={colors.divider} />

              {/* ── FESTIVAL ALERTS ── */}
              <SectionHeader
                icon="gift-outline"
                label={t('settings.notifications.festivalAlerts')}
                gold={colors.gold}
              />

              <ToggleRow
                icon="sparkles-outline"
                iconColor="#F97316"
                label={t('settings.notifications.festivalReminders')}
                sub={t('settings.notifications.festivalRemindersSub')}
                value={prefs.festivalAlerts}
                onValueChange={(v) => updatePref("festivalAlerts", v)}
                colors={colors}
              />

              {prefs.festivalAlerts && (
                <View style={st.daysBeforeRow}>
                  <Text style={[st.pickerLabel, { color: colors.textMuted }]}>
                    {t('settings.notifications.notify')}
                  </Text>
                  <View style={st.daysBeforeBtns}>
                    {[1, 2].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          st.daysBtn,
                          { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary },
                          prefs.festivalDaysBefore === d && { backgroundColor: colors.gold + "20", borderColor: colors.gold },
                        ]}
                        onPress={() => updatePref("festivalDaysBefore", d)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            st.daysBtnTxt,
                            { color: prefs.festivalDaysBefore === d ? colors.gold : colors.textMuted },
                          ]}
                        >
                          {d} {t('common.daysBefore')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Divider color={colors.divider} />

              {/* ── SMART SPIRITUAL ALERTS ── */}
              <SectionHeader
                icon="moon-outline"
                label={t('settings.notifications.smartAlerts')}
                gold={colors.gold}
              />

              <ToggleRow
                icon="leaf-outline"
                iconColor="#22C55E"
                label={t('settings.notifications.ekadashi')}
                sub={t('settings.notifications.ekadashiSub')}
                value={prefs.ekadashiAlert}
                onValueChange={(v) => updatePref("ekadashiAlert", v)}
                colors={colors}
              />
              <ToggleRow
                icon="prism-outline"
                iconColor="#818CF8"
                label={t('settings.notifications.pradosh')}
                sub={t('settings.notifications.pradoshSub')}
                value={prefs.pradoshAlert}
                onValueChange={(v) => updatePref("pradoshAlert", v)}
                colors={colors}
              />
              <ToggleRow
                icon="radio-button-on-outline"
                iconColor="#F4D160"
                label={t('settings.notifications.purnima')}
                sub={t('settings.notifications.purnimaSub')}
                value={prefs.purnimAlert}
                onValueChange={(v) => updatePref("purnimAlert", v)}
                colors={colors}
              />
              <ToggleRow
                icon="radio-button-off-outline"
                iconColor="#94A3B8"
                label={t('settings.notifications.amavasya')}
                sub={t('settings.notifications.amavasySub')}
                value={prefs.amavasaAlert}
                onValueChange={(v) => updatePref("amavasaAlert", v)}
                colors={colors}
              />

              <Divider color={colors.divider} />

              {/* ── PERSONALIZED REMINDERS ── */}
              <SectionHeader
                icon="person-circle-outline"
                label={t('settings.notifications.personalizedReminders')}
                gold={colors.gold}
              />

              <View style={[st.personalizedBox, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
                <Ionicons name="construct-outline" size={18} color={colors.textMuted} />
                <Text style={[st.personalizedTxt, { color: colors.textMuted }]}>
                  {t('settings.notifications.personalizedNote')}
                </Text>
              </View>

              <Divider color={colors.divider} />

              {/* ── SOUND & VIBRATION ── */}
              <SectionHeader
                icon="volume-high-outline"
                label={t('settings.notifications.soundVibration')}
                gold={colors.gold}
              />

              <ToggleRow
                icon="musical-note-outline"
                iconColor="#06B6D4"
                label={t('settings.notifications.sound')}
                sub={t('settings.notifications.soundSub')}
                value={prefs.soundEnabled}
                onValueChange={(v) => updatePref("soundEnabled", v)}
                colors={colors}
              />
              <ToggleRow
                icon="phone-portrait-outline"
                iconColor="#10B981"
                label={t('settings.notifications.vibration')}
                sub={t('settings.notifications.vibrationSub')}
                value={prefs.vibrationEnabled}
                onValueChange={(v) => updatePref("vibrationEnabled", v)}
                colors={colors}
              />
            </>
          )}
        </View>

        {/* ══════════════════════════════════════
            ABOUT APP
        ══════════════════════════════════════ */}
        <View style={cardStyle}>
          <View style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>{t('settings.about.title')}</Text>
          </View>
          <InfoRow
            icon="information-circle"
            label={t('settings.about.version')}
            value={Constants.expoConfig?.version ?? "1.0.0"}
            colors={colors}
          />
          <Divider color={colors.divider} />
          <InfoRow
            icon="book"
            label={t('settings.about.purpose')}
            value={t('settings.about.purposeValue')}
            colors={colors}
          />
          <Divider color={colors.divider} />
          <InfoRow
            icon="location"
            label={t('settings.about.origin')}
            value={t('settings.about.originValue')}
            colors={colors}
          />
        </View>

        {/* ══════════════════════════════════════
            DEVELOPER — COMPACT VERSION
        ══════════════════════════════════════ */}
        <View style={cardStyle}>
          <View style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>{t('settings.developer.title')}</Text>
          </View>

          <View style={st.devCompact}>
            <View style={[st.devAvatarSm, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "50" }]}>
              <Text style={{ fontSize: 18 }}>🧑‍💻</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[st.devNameSm, { color: colors.textPrimary }]}>{DEV.name}</Text>
                <Text style={[st.devNameHiSm, { color: colors.gold }]}>· {DEV.nameHi}</Text>
              </View>
              <Text style={[st.devRoleSm, { color: colors.textMuted }]}>{DEV.role} · India 🇮🇳</Text>
            </View>
          </View>

          <Divider color={colors.divider} />

          <LinkRow
            icon="mail"
            label={t('settings.developer.email')}
            sub={DEV.email}
            onPress={() => {
              const s = encodeURIComponent("Panchang App Feedback");
              const b = encodeURIComponent("Namaste,\n\n");
              openLink(`mailto:${DEV.email}?subject=${s}&body=${b}`);
            }}
            iconColor="#EA4335"
            colors={colors}
          />
          <LinkRow
            icon="globe-outline"
            label={t('settings.developer.portfolio')}
            sub={DEV.website}
            onPress={() => openLink(DEV.website)}
            iconColor={colors.gold}
            colors={colors}
          />
          <LinkRow
            icon="logo-linkedin"
            label={t('settings.developer.linkedin')}
            onPress={() => openLink(DEV.linkedin)}
            iconColor="#0A66C2"
            colors={colors}
          />
        </View>

        {/* ══════════════════════════════════════
            FEEDBACK
        ══════════════════════════════════════ */}
        <View style={cardStyle}>
          <View style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>{t('settings.feedback.title')}</Text>
          </View>
          <LinkRow
            icon="mail-outline"
            label={t('settings.feedback.send')}
            sub={t('settings.feedback.sendSub')}
            onPress={() => {
              const s = encodeURIComponent("Panchang App Feedback");
              const b = encodeURIComponent("Namaste,\n\n");
              openLink(`mailto:${DEV.email}?subject=${s}&body=${b}`);
            }}
            iconColor={colors.gold}
            colors={colors}
          />
          <LinkRow
            icon="star-outline"
            label={t('settings.feedback.rate')}
            sub={t('settings.feedback.rateSub')}
            onPress={() => openLink("https://play.google.com/store")}
            iconColor="#F59E0B"
            colors={colors}
          />
          <LinkRow
            icon="share-social-outline"
            label={t('settings.feedback.share')}
            sub={t('settings.feedback.shareSub')}
            onPress={() =>
              Share.share({
                title: "Panchang — Daily Hindu Calendar",
                message: `🪔 Jai Shri Ram!\n\nBeautiful Panchang app for daily Hindu calendar, bhajans, mantras & Gita.\n\nDownload: ${DEV.website}`,
                url: DEV.website,
              })
            }
            iconColor="#22C55E"
            colors={colors}
          />
        </View>

        {/* ══════════════════════════════════════
            FOOTER
        ══════════════════════════════════════ */}
        <View style={st.footer}>
          <Text style={[st.footerOm, { color: colors.gold }]}>ॐ</Text>
          <Text style={[st.footerMain, { color: colors.textPrimary }]}>
            {t('settings.footer.main')}
          </Text>
          <Text style={[st.footerSub, { color: colors.gold + "CC" }]}>
            {t('settings.footer.sub')}
          </Text>
          <Text style={[st.footerMantra, { color: colors.textMuted }]}>
            {t('settings.footer.mantra')}
          </Text>
        </View>
      </ScrollView>

      {/* ── TIME PICKER MODAL ── */}
      <TimePickerModal
        visible={timePicker.visible}
        initial={timePicker.current}
        title={timePicker.title}
        onConfirm={handleTimeConfirm}
        onClose={() => setTimePicker((p) => ({ ...p, visible: false }))}
        t={t}
        colors={colors}
      />
    </GradientBackground>
  );
}

// ─────────────────────────────────────────────
// INFO ROW
// ─────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) => (
  <View style={st.infoRow}>
    <Ionicons name={icon as any} size={22} color={colors.gold} />
    <View style={st.infoText}>
      <Text style={[st.infoLabel, { color: colors.gold }]}>{label}</Text>
      <Text style={[st.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1 },

  cardWrap: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },

  divider: { height: 1, marginHorizontal: spacing.md },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  sectionHeaderIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  // Language grid
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: "22%",
    alignItems: "center",
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  langBtnSub: {
    fontSize: 9,
    marginTop: 2,
  },

  // Theme grid
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 10,
  },
  themeBtn: {
    width: "18%",
    aspectRatio: 0.85,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
  },
  themeBtnGradient: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  themeAccentDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.9,
  },
  themeCheck: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  themeBtnLabel: {
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingTxt: { fontSize: typography.fontSize.sm },

  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.md,
    backgroundColor: "#F59E0B18",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B40",
    padding: spacing.md,
  },
  permBannerTitle: { fontSize: typography.fontSize.sm, color: "#F59E0B", fontWeight: "600" },
  permBannerSub: { fontSize: 11, marginTop: 2 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabels: { flex: 1 },
  toggleLabel: { fontSize: typography.fontSize.sm, fontWeight: "600" },
  toggleSub: { fontSize: 11, marginTop: 1 },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  timeRowLabel: { flex: 1, fontSize: 12 },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timePillTxt: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  pickerLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 4,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: 4,
    marginBottom: 6,
  },
  dayBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayBtnTxt: { fontSize: 9, fontWeight: "600" },

  daysBeforeRow: { paddingHorizontal: spacing.md, marginBottom: 6 },
  daysBeforeBtns: { flexDirection: "row", gap: spacing.sm, marginTop: 4 },
  daysBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  daysBtnTxt: { fontSize: 12, fontWeight: "600" },

  personalizedBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
  },
  personalizedTxt: { flex: 1, fontSize: 12, lineHeight: 18 },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
  },
  infoText: { flex: 1, marginLeft: spacing.md },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.5,
  },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  linkLabel: { fontSize: typography.fontSize.md, fontWeight: "600" },
  linkSub: { fontSize: typography.fontSize.sm, marginTop: 2 },

  devCompact: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  devAvatarSm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  devNameSm: { fontSize: typography.fontSize.md, fontWeight: "700" },
  devNameHiSm: { fontSize: 12 },
  devRoleSm: { fontSize: 11, marginTop: 2 },

  footer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 4,
    marginTop: spacing.md,
  },
  footerOm: { fontSize: typography.fontSize.display },
  footerMain: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
  footerSub: { fontSize: typography.fontSize.md },
  footerMantra: { fontSize: typography.fontSize.sm, marginTop: spacing.xs },
});

// ─────────────────────────────────────────────
// TIME PICKER MODAL STYLES
// ─────────────────────────────────────────────
const tp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    borderRadius: 20,
    width: 280,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  pickers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  wheel: { alignItems: "center", gap: 4 },
  arrow: { padding: 6 },
  digit: {
    fontSize: 44,
    fontWeight: "bold",
    minWidth: 72,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  unit: { fontSize: 10, fontWeight: "600" },
  colon: { fontSize: 40, fontWeight: "bold", marginBottom: 16 },
  actions: { flexDirection: "row", gap: spacing.md, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelTxt: { fontSize: typography.fontSize.sm, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmTxt: { fontSize: typography.fontSize.sm, fontWeight: "bold" },
});
