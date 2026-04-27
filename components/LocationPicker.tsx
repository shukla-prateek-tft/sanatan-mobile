/**
 * LocationPickerModal.tsx
 *
 * Full-screen modal that:
 *  1. Offers "Detect via GPS" button (requests permission)
 *  2. Falls back to live city search (Nominatim) if GPS denied
 *  3. Shows search results as tappable cards
 *  4. User picks a city → saved to AsyncStorage → never shown again
 *
 * Usage — wrap your root screen or any screen that uses panchangService:
 *
 *   import { usePanchangLocation } from '../services/panchangService';
 *   import { LocationPickerModal }  from '../components/LocationPickerModal';
 *
 *   export default function HomeScreen() {
 *     const loc = usePanchangLocation();
 *
 *     if (loc.status === 'idle' || loc.status === 'detecting') {
 *       return <LoadingSpinner />;
 *     }
 *
 *     return (
 *       <>
 *         <YourActualScreen location={loc.location} />
 *         <LocationPickerModal
 *           visible={loc.status === 'denied'}
 *           onDetectGPS={loc.detectGPS}
 *           onPickCity={loc.pickCity}
 *           error={loc.error}
 *         />
 *       </>
 *     );
 *   }
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Keyboard,
  Animated as RNAnimated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, theme } from "../theme";
import { searchCities, CityResult } from "../services/panchangService";
import { useTranslation } from "react-i18next";

const { height: SH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onDetectGPS: () => void;
  onPickCity: (city: CityResult) => void;
  error?: string | null;
  /** Optional: called when user taps "skip for now" — uses fallback coords */
  onSkip?: () => void;
}

// ─────────────────────────────────────────────
// CITY RESULT ROW
// ─────────────────────────────────────────────
const CityRow = ({
  item,
  onPress,
}: {
  item: CityResult;
  onPress: () => void;
}) => (
  <TouchableOpacity style={st.cityRow} onPress={onPress} activeOpacity={0.75}>
    <View style={st.cityRowIcon}>
      <Ionicons name="location" size={18} color={colors.gold} />
    </View>
    <View style={st.cityRowInfo}>
      <Text style={st.cityName}>{item.name}</Text>
      <Text style={st.cityDisplay} numberOfLines={1}>
        {item.display}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export function LocationPickerModal({
  visible,
  onDetectGPS,
  onPickCity,
  error,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideAnim = useRef(new RNAnimated.Value(SH)).current;

  // Slide-up animation when visible
  useEffect(() => {
    RNAnimated.spring(slideAnim, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [visible]);

  // Live search with 400ms debounce
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchCities(text);
        setResults(res);
        if (res.length === 0)
          setSearchError(t('locationPicker.notFound'));
      } catch {
        setSearchError(t('locationPicker.searchFailed'));
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleGPS = useCallback(async () => {
    setDetecting(true);
    Keyboard.dismiss();
    await onDetectGPS();
    setDetecting(false);
  }, [onDetectGPS]);

  const handlePick = useCallback(
    (city: CityResult) => {
      Keyboard.dismiss();
      setQuery("");
      setResults([]);
      onPickCity(city);
    },
    [onPickCity],
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={st.overlay}>
        <RNAnimated.View
          style={[st.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={st.handle} />

          {/* Title */}
          <View style={st.titleRow}>
            <Text style={st.titleOm}>ॐ</Text>
            <View>
              <Text style={st.titleHi}>{t('locationPicker.title')}</Text>
            </View>
          </View>

          <Text style={st.subtitle}>{t('locationPicker.subtitle')}</Text>

          {/* Error banner */}
          {(error || searchError) && (
            <View style={st.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={st.errorText}>{error ?? searchError}</Text>
            </View>
          )}

          {/* GPS Button */}
          <TouchableOpacity
            style={[st.gpsBtn, detecting && st.gpsBtnLoading]}
            onPress={handleGPS}
            disabled={detecting}
            activeOpacity={0.8}
          >
            {detecting ? (
              <ActivityIndicator size="small" color={colors.bgSecondary} />
            ) : (
              <Ionicons name="navigate" size={20} color={colors.bgSecondary} />
            )}
            <View>
              <Text style={st.gpsBtnTxtHi}>
                {detecting ? t('locationPicker.detecting') : t('locationPicker.gps')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={st.dividerRow}>
            <View style={st.dividerLine} />
            <Text style={st.dividerTxt}>{t('locationPicker.orSearch')}</Text>
            <View style={st.dividerLine} />
          </View>

          {/* Search input */}
          <View style={st.searchBar}>
            <Ionicons name="search" size={18} color={colors.gold} />
            <TextInput
              style={st.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder={t('locationPicker.searchPlaceholder')}
              placeholderTextColor={colors.textMuted + "80"}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {searching && (
              <ActivityIndicator size="small" color={colors.gold} />
            )}
            {query.length > 0 && !searching && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <CityRow item={item} onPress={() => handlePick(item)} />
              )}
              style={st.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Empty state / popular cities shortcut */}
          {query.length === 0 && results.length === 0 && (
            <View style={st.suggestions}>
              <Text style={st.suggestionsLabel}>
                {t('locationPicker.popularCities')}
              </Text>
              <View style={st.suggestionChips}>
                {[
                  { name: "Mumbai", latitude: 19.076, longitude: 72.877 },
                  { name: "Delhi", latitude: 28.613, longitude: 77.209 },
                  { name: "Varanasi", latitude: 25.32, longitude: 83.006 },
                  { name: "Vrindavan", latitude: 27.58, longitude: 77.7 },
                  { name: "Tirupati", latitude: 13.629, longitude: 79.418 },
                  { name: "Haridwar", latitude: 29.945, longitude: 78.163 },
                  { name: "Ujjain", latitude: 23.182, longitude: 75.777 },
                  { name: "Mathura", latitude: 27.492, longitude: 77.673 },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={st.chip}
                    onPress={() =>
                      handlePick({
                        name: c.name,
                        display: `${c.name}, India`,
                        latitude: c.latitude,
                        longitude: c.longitude,
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={st.chipTxt}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Skip */}
          {onSkip && (
            <TouchableOpacity style={st.skipBtn} onPress={onSkip}>
              <Text style={st.skipTxt}>{t('locationPicker.skip')}</Text>
            </TouchableOpacity>
          )}
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    maxHeight: SH * 0.92,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted + "50",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleOm: { fontSize: 40, color: colors.gold, opacity: 0.85, lineHeight: 48 },
  titleHi: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
  },
  titleEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#EF444420",
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#EF444445",
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: 12, color: "#EF4444", lineHeight: 18 },

  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  gpsBtnLoading: { opacity: 0.75 },
  gpsBtnTxtHi: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.bgSecondary,
  },
  gpsBtnTxtEn: { fontSize: 11, color: colors.bgSecondary + "CC", marginTop: 1 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerTxt: { fontSize: 11, color: colors.textMuted, textAlign: "center" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + "40",
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    minHeight: 36,
  },

  resultsList: { maxHeight: 260 },

  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "70",
  },
  cityRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gold + "35",
  },
  cityRowInfo: { flex: 1 },
  cityName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cityDisplay: { fontSize: 11, color: colors.textMuted },

  suggestions: { marginTop: spacing.sm },
  suggestionsLabel: {
    fontSize: 11,
    color: colors.gold + "AA",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  suggestionChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold + "35",
  },
  chipTxt: { fontSize: 13, color: colors.gold },

  skipBtn: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipTxt: { fontSize: 12, color: colors.textMuted },
});
