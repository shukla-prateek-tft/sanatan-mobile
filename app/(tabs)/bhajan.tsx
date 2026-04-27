/**
 * BhajanScreen.tsx — FIXED
 *
 * Fix 1: Only one song plays at a time (proper sound cleanup before loading new track)
 * Fix 2: Mini player bar is rendered OUTSIDE the tab content so it persists across all tabs
 * Fix 3: isLoadingRef prevents race-condition double-play on fast taps
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  Animated as RNAnimated,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { GradientBackground } from "../../components/GradientBackground";
import { colors, spacing, typography } from "../../theme";
import { bhajanService, Bhajan } from "../../services/bhajanService";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { artistService } from "@/services/artistsService";
import { useTranslation } from "react-i18next";

const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface LocalBhajan {
  id: string;
  title: string;
  artist: string;
  uri: string;
  duration?: string;
  isLocal: true;
}
type AnyBhajan = Bhajan | LocalBhajan;
type Tab = "library" | "youtube" | "artists" | "local";
interface Artist {
  id: string;
  name: string;
  nameHi: string;
  deity: string;
  deityHi: string;
  description: string;
  emoji: string;
  youtubeQuery: string;
  color: string;
  tags: string[];
}

// ─────────────────────────────────────────────
// DEITY CONFIG
// ─────────────────────────────────────────────
const DEITIES = [
  { en: "All", hi: "सभी", icon: "🕉️" },
  { en: "Shiva", hi: "शिव", icon: "🔱" },
  { en: "Vishnu", hi: "विष्णु", icon: "🪷" },
  { en: "Durga", hi: "दुर्गा", icon: "🌸" },
  { en: "Krishna", hi: "कृष्ण", icon: "🪈" },
  { en: "Rama", hi: "राम", icon: "🏹" },
  { en: "Ganesha", hi: "गणेश", icon: "🐘" },
  { en: "Hanuman", hi: "हनुमान", icon: "🙏" },
];

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function getDeityEmoji(deity: string): string {
  const map: Record<string, string> = {
    Shiva: "🔱",
    Vishnu: "🪷",
    Durga: "🌸",
    Krishna: "🪈",
    Rama: "🏹",
    Ganesha: "🐘",
    Hanuman: "🙏",
    Bhakti: "🕉️",
  };
  return map[deity] ?? "🎵";
}

// ─────────────────────────────────────────────
// SPINNING DISC
// ─────────────────────────────────────────────
const SpinDisc = ({
  isPlaying,
  size = 52,
  emoji = "🎵",
}: {
  isPlaying: boolean;
  size?: number;
  emoji?: string;
}) => {
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      rotate.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(rotate);
    }
  }, [isPlaying]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.gold + "20",
          borderWidth: 2,
          borderColor: colors.gold + "50",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({
  icon,
  msgHi,
  msgEn,
  subEn,
}: {
  icon: string;
  msgHi: string;
  msgEn: string;
  subEn?: string;
}) {
  return (
    <View style={st.emptyState}>
      <Ionicons name={icon as any} size={60} color={colors.textMuted + "60"} />
      <Text style={st.emptyHi}>{msgHi}</Text>
      <Text style={st.emptyEn}>{msgEn}</Text>
      {subEn ? <Text style={st.emptySub}>{subEn}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// LAZY WEBVIEW
// ─────────────────────────────────────────────
function YouTubeWebView({ url }: { url: string }) {
  try {
    const { WebView } = require("react-native-webview");
    return (
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: "#0F0F0F" }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0F0F0F",
            }}
          >
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={{ color: "#888", marginTop: 12 }}>
              YouTube लोड हो रहा है…
            </Text>
          </View>
        )}
      />
    );
  } catch {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Ionicons name="logo-youtube" size={64} color="#FF0000" />
        <Text
          style={{
            color: "white",
            fontSize: 18,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Install react-native-webview to use YouTube in-app
        </Text>
      </View>
    );
  }
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function BhajanScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [selectedDeity, setSelectedDeity] = useState("All");
  const [localBhajans, setLocalBhajans] = useState<LocalBhajan[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

  // ── Audio state ────────────────────────────────────────────
  // FIX: soundRef holds the live Audio.Sound object so it's always current
  // in callbacks without stale closure issues
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingBhajan, setPlayingBhajan] = useState<AnyBhajan | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  // FIX: guard flag prevents race condition when tapping quickly
  const loadingRef = useRef(false);

  const miniBarAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(miniBarAnim, {
      toValue: playingBhajan ? 1 : 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [!!playingBhajan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const libraryBhajans: Bhajan[] =
    selectedDeity === "All"
      ? bhajanService.getAllBhajans()
      : bhajanService.getBhajansByDeity(selectedDeity as any);

  // ─────────────────────────────────────────────────────────
  // FIX #1 — PLAY / PAUSE: properly unload before loading new
  // ─────────────────────────────────────────────────────────
  const playBhajan = useCallback(
    async (bhajan: AnyBhajan) => {
      // Guard: ignore tap while a track is loading
      if (loadingRef.current) return;

      try {
        // ── Same track → toggle play/pause ───────────────────
        if (playingBhajan?.id === bhajan.id && soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await soundRef.current.pauseAsync();
              setIsPlaying(false);
            } else {
              await soundRef.current.playAsync();
              setIsPlaying(true);
            }
          }
          return;
        }

        // ── New track ─────────────────────────────────────────
        loadingRef.current = true;
        setIsLoading(true);

        // IMPORTANT: unload previous sound BEFORE setting new state
        // This prevents the old track from continuing to play
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (_) {
            /* ignore unload errors */
          }
          soundRef.current = null;
        }

        setPlayingBhajan(bhajan);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);

        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const uri = (bhajan as LocalBhajan).uri ?? (bhajan as Bhajan).audioUrl;

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            setIsPlaying(status.isPlaying);
            setPosition(status.positionMillis ?? 0);
            setDuration(status.durationMillis ?? 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          },
        );

        // Store in ref immediately so stop/pause always targets the right instance
        soundRef.current = newSound;
        setIsPlaying(true);
      } catch (err) {
        console.error("playBhajan error:", err);
        Alert.alert(
          "त्रुटि · Error",
          "Could not play this track. Check the audio URL.",
        );
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [playingBhajan],
  );

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
    setPlayingBhajan(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }, []);

  const seekTo = useCallback(
    async (pct: number) => {
      if (!soundRef.current || duration === 0) return;
      await soundRef.current.setPositionAsync(pct * duration);
    },
    [duration],
  );

  // ── IMPORT ─────────────────────────────────────────────────
  const importLocalFiles = useCallback(async () => {
    try {
      setImportLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const newBhajans: LocalBhajan[] = result.assets.map((asset) => ({
        id: `local_${Date.now()}_${Math.random()}`,
        title: asset.name.replace(/\.[^.]+$/, ""),
        artist: "Local File",
        uri: asset.uri,
        isLocal: true as const,
      }));
      setLocalBhajans((prev) => {
        const existing = new Set(prev.map((b) => b.title));
        return [...prev, ...newBhajans.filter((b) => !existing.has(b.title))];
      });
      setActiveTab("local");
    } catch {
      Alert.alert("त्रुटि · Error", "Could not import file.");
    } finally {
      setImportLoading(false);
    }
  }, []);

  const removeLocalBhajan = useCallback(
    (id: string) => {
      setLocalBhajans((prev) => prev.filter((b) => b.id !== id));
      if (playingBhajan?.id === id) stopPlayback();
    },
    [playingBhajan, stopPlayback],
  );

  const openYoutube = useCallback((query: string) => {
    setYtUrl(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    );
    setShowYoutube(true);
  }, []);

  // ─────────────────────────────────────────────
  // BHAJAN CARD
  // ─────────────────────────────────────────────
  const renderBhajanCard = ({ item }: { item: AnyBhajan }) => {
    const playing = playingBhajan?.id === item.id;
    const loadingThis = isLoading && playing;
    const isLocal = (item as LocalBhajan).isLocal;
    const deity = (item as Bhajan).deity ?? "";
    return (
      <TouchableOpacity
        style={[st.bhajanCard, playing && st.bhajanCardActive]}
        onPress={() => playBhajan(item)}
        activeOpacity={0.78}
      >
        <View style={st.discWrap}>
          {loadingThis ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <SpinDisc
              isPlaying={playing && isPlaying}
              size={50}
              emoji={deity ? getDeityEmoji(deity) : "🎵"}
            />
          )}
        </View>
        <View style={st.bhajanInfo}>
          <Text
            style={[st.bhajanTitle, playing && st.bhajanTitleActive]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={st.bhajanArtist} numberOfLines={1}>
            {item.artist}
          </Text>
          <View style={st.bhajanMeta}>
            {deity ? (
              <View style={st.deityPill}>
                <Text style={st.deityPillTxt}>🙏 {deity}</Text>
              </View>
            ) : null}
            {isLocal ? (
              <View
                style={[
                  st.deityPill,
                  { borderColor: "#60A5FA50", backgroundColor: "#60A5FA15" },
                ]}
              >
                <Text style={[st.deityPillTxt, { color: "#60A5FA" }]}>
                  📁 Local
                </Text>
              </View>
            ) : null}
            {(item as Bhajan).duration && (
              <Text style={st.durationTxt}>⏱ {(item as Bhajan).duration}</Text>
            )}
          </View>
        </View>
        <View style={st.bhajanActions}>
          {playing && isPlaying ? (
            <Ionicons name="pause-circle" size={36} color={colors.gold} />
          ) : playing ? (
            <Ionicons name="play-circle" size={36} color={colors.gold} />
          ) : (
            <Ionicons
              name="play-circle-outline"
              size={36}
              color={colors.textMuted}
            />
          )}
          {isLocal && (
            <TouchableOpacity
              onPress={() => removeLocalBhajan(item.id)}
              style={{ marginTop: 4 }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.textMuted + "80"}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────────
  // ARTIST CARD
  // ─────────────────────────────────────────────
  const renderArtistCard = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={[
        st.artistCard,
        { borderLeftColor: item.color, borderLeftWidth: 3 },
      ]}
      onPress={() => openYoutube(item.youtubeQuery)}
      activeOpacity={0.78}
    >
      <View style={[st.artistEmojiBg, { backgroundColor: item.color + "20" }]}>
        <Text style={st.artistEmoji}>{item.emoji}</Text>
      </View>
      <View style={st.artistInfo}>
        <Text style={st.artistName}>{item.name}</Text>
        <Text style={st.artistNameHi}>{item.nameHi}</Text>
        <Text style={st.artistDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={st.artistTagRow}>
          {item.tags.map((tag, index) => (
            <View
              key={tag + index}
              style={[
                st.artistTag,
                {
                  backgroundColor: item.color + "20",
                  borderColor: item.color + "40",
                },
              ]}
            >
              <Text style={[st.artistTagTxt, { color: item.color }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={st.ytBtnWrap}>
        <View style={st.ytBtn}>
          <Ionicons name="logo-youtube" size={20} color="#FF0000" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────
  // TAB CONTENT
  // ─────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case "library":
        return (
          <>
            <View style={st.filterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.filterScroll}
              >
                {DEITIES.map((d) => (
                  <TouchableOpacity
                    key={d.en}
                    style={[
                      st.filterBtn,
                      selectedDeity === d.en && st.filterBtnActive,
                    ]}
                    onPress={() => setSelectedDeity(d.en)}
                    activeOpacity={0.7}
                  >
                    <Text style={st.filterIcon}>{d.icon}</Text>
                    <Text
                      style={[
                        st.filterTxtHi,
                        selectedDeity === d.en && st.filterTxtActive,
                      ]}
                    >
                      {d.hi}
                    </Text>
                    <Text
                      style={[
                        st.filterTxtEn,
                        selectedDeity === d.en && st.filterTxtActive,
                      ]}
                    >
                      {d.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <FlatList
              data={libraryBhajans as AnyBhajan[]}
              keyExtractor={(i) => i.id}
              renderItem={renderBhajanCard}
              // FIX #2: extra bottom padding so content isn't hidden behind mini player
              contentContainerStyle={[
                st.listContent,
                { paddingBottom: playingBhajan ? 90 : 20 },
              ]}
              ListEmptyComponent={
                <EmptyState
                  icon="musical-notes-outline"
                  msgHi={t('bhajan.empty.noResults')}
                  msgEn=""
                />
              }
            />
          </>
        );

      case "youtube":
        return (
          <ScrollView
            contentContainerStyle={[
              st.ytTabContent,
              { paddingBottom: playingBhajan ? 110 : 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.ytTitle}>{t('bhajan.youtube.title')}</Text>
            <Text style={st.ytSectionLabel}>{t('bhajan.youtube.quickSearch')}</Text>
            <View style={st.ytChipRow}>
              {[
                "Shiv Bhajan",
                "Krishna Kirtan",
                "Aarti Sangrah",
                "Hanuman Chalisa",
                "Durga Stuti",
                "Ram Bhajan",
                "Morning Bhajan",
                "Navratri Bhajan",
                "ISKCON Kirtan",
                "Bhakti Sangeet",
                "Bajrang Baan",
                "Ganesh Aarti",
              ].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={st.ytChip}
                  onPress={() => openYoutube(q)}
                  activeOpacity={0.7}
                >
                  <Text style={st.ytChipTxt}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={st.ytSectionLabel}>{t('bhajan.youtube.trending')}</Text>
            {[
              {
                title: "Har Har Shambhu",
                query: "Har Har Shambhu bhajan",
                icon: "🔱",
              },
              {
                title: "Jai Shri Ram",
                query: "Jai Shri Ram bhajan",
                icon: "🏹",
              },
              {
                title: "Achyutam Keshavam",
                query: "Achyutam Keshavam bhajan",
                icon: "🪷",
              },
              {
                title: "Hanuman Chalisa",
                query: "Hanuman Chalisa fast",
                icon: "🙏",
              },
              {
                title: "Lakshmi Aarti",
                query: "Lakshmi Aarti Om Jai Lakshmi",
                icon: "✨",
              },
              {
                title: "Vaishnav Jan To",
                query: "Vaishnav Jan To bhajan",
                icon: "🕉️",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.title}
                style={st.ytTrendItem}
                onPress={() => openYoutube(item.query)}
                activeOpacity={0.75}
              >
                <Text style={st.ytTrendIcon}>{item.icon}</Text>
                <Text style={st.ytTrendTitle}>{item.title}</Text>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
              </TouchableOpacity>
            ))}
            <View style={st.ytNote}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={st.ytNoteText}>{t('bhajan.youtube.note')}</Text>
            </View>
          </ScrollView>
        );

      case "artists":
        return (
          <FlatList
            data={artistService.getAllArtists()}
            keyExtractor={(a) => a.id}
            renderItem={renderArtistCard}
            contentContainerStyle={[
              st.listContent,
              { paddingBottom: playingBhajan ? 90 : 20 },
            ]}
            ListHeaderComponent={
              <View style={st.artistsHeader}>
                <Text style={st.artistsHeaderHi}>{t('bhajan.popularArtists')}</Text>
                <Text style={st.artistsHeaderEn}>{t('bhajan.artistsSubtitle')}</Text>
              </View>
            }
          />
        );

      case "local":
        return (
          <>
            <TouchableOpacity
              style={st.importBtn}
              onPress={importLocalFiles}
              activeOpacity={0.8}
              disabled={importLoading}
            >
              {importLoading ? (
                <ActivityIndicator size="small" color={colors.bgSecondary} />
              ) : (
                <Ionicons
                  name="folder-open-outline"
                  size={22}
                  color={colors.bgSecondary}
                />
              )}
              <Text style={st.importBtnTxt}>
                {importLoading ? t('bhajan.importing') : t('bhajan.import')}
              </Text>
            </TouchableOpacity>
            {localBhajans.length === 0 ? (
              <EmptyState
                icon="phone-portrait-outline"
                msgHi={t('bhajan.empty.noLocal')}
                msgEn=""
                subEn={t('bhajan.empty.noLocalSub')}
              />
            ) : (
              <FlatList
                data={localBhajans as AnyBhajan[]}
                keyExtractor={(i) => i.id}
                renderItem={renderBhajanCard}
                contentContainerStyle={[
                  st.listContent,
                  { paddingBottom: playingBhajan ? 90 : 20 },
                ]}
              />
            )}
          </>
        );
    }
  };

  // ─────────────────────────────────────────────
  // FIX #2 — Mini player translate animation
  // ─────────────────────────────────────────────
  const miniBarTranslate = miniBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <GradientBackground>
      {/*
       * FIX #2: The entire screen is ONE View. Tab content is inside flex:1,
       * and the mini player sits BELOW it as a sibling — not inside any tab.
       * This means it persists regardless of which tab is active.
       */}
      <View style={st.container}>
        {/* ── HEADER ── */}
        <View style={st.header}>
          <View>
            <Text style={st.headerHi}>{t('bhajan.title')}</Text>
          </View>
          <TouchableOpacity
            style={st.importHeaderBtn}
            onPress={importLocalFiles}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.gold} />
            <Text style={st.importHeaderTxt}>{t('bhajan.add')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB BAR ── */}
        <View style={st.tabBar}>
          {(
            [
              { key: "library", icon: "library-outline" },
              { key: "youtube", icon: "logo-youtube" },
              { key: "artists", icon: "mic-outline" },
              { key: "local", icon: "phone-portrait-outline" },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[st.tabBtn, activeTab === tab.key && st.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? colors.gold : colors.textMuted}
              />
              <Text
                style={[
                  st.tabLabelHi,
                  activeTab === tab.key && st.tabLabelActive,
                ]}
              >
                {t(`bhajan.tabs.${tab.key}`)}
              </Text>
              {tab.key === "local" && localBhajans.length > 0 && (
                <View style={st.tabBadge}>
                  <Text style={st.tabBadgeTxt}>{localBhajans.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB CONTENT ── flex:1 so it fills space above mini player */}
        <View style={{ flex: 1 }}>{renderTabContent()}</View>

        {/* ── MINI PLAYER BAR ────────────────────────────────────────────
         * FIX #2: Rendered here as a sibling of tab content, NOT inside any tab.
         * It is always mounted; visibility controlled by translateY animation.
         * This means switching tabs does NOT unmount or hide the player.
         * ─────────────────────────────────────────────────────────────── */}
        <RNAnimated.View
          style={[
            st.miniBar,
            { transform: [{ translateY: miniBarTranslate }] },
          ]}
        >
          {playingBhajan && (
            <TouchableOpacity
              style={st.miniBarInner}
              onPress={() => setShowNowPlaying(true)}
              activeOpacity={0.9}
            >
              <SpinDisc
                isPlaying={isPlaying}
                size={40}
                emoji={getDeityEmoji((playingBhajan as Bhajan).deity ?? "")}
              />
              <View style={st.miniBarInfo}>
                <Text style={st.miniBarTitle} numberOfLines={1}>
                  {playingBhajan.title}
                </Text>
                <Text style={st.miniBarArtist} numberOfLines={1}>
                  {playingBhajan.artist}
                </Text>
                <View style={st.miniProgress}>
                  <View
                    style={[
                      st.miniProgressFill,
                      {
                        width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={st.miniControls}>
                <TouchableOpacity
                  onPress={() => playBhajan(playingBhajan)}
                  style={st.miniControlBtn}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color={colors.gold}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={stopPlayback}
                  style={st.miniControlBtn}
                >
                  <Ionicons name="stop" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        </RNAnimated.View>
      </View>

      {/* ════════════ NOW PLAYING MODAL ════════════ */}
      <Modal
        visible={showNowPlaying}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNowPlaying(false)}
      >
        <View style={npStyle.overlay}>
          <View style={npStyle.sheet}>
            <View style={npStyle.handle} />
            <TouchableOpacity
              style={npStyle.closeBtn}
              onPress={() => setShowNowPlaying(false)}
            >
              <Ionicons
                name="chevron-down"
                size={26}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <View style={npStyle.discArea}>
              <SpinDisc
                isPlaying={isPlaying}
                size={160}
                emoji={
                  playingBhajan
                    ? getDeityEmoji((playingBhajan as Bhajan).deity ?? "")
                    : "🎵"
                }
              />
            </View>
            <View style={npStyle.trackInfo}>
              <Text style={npStyle.trackTitle}>
                {playingBhajan?.title ?? ""}
              </Text>
              <Text style={npStyle.trackArtist}>
                {playingBhajan?.artist ?? ""}
              </Text>
              {(playingBhajan as Bhajan)?.deity && (
                <View style={npStyle.deityBadge}>
                  <Text style={npStyle.deityTxt}>
                    🙏 {(playingBhajan as Bhajan).deity}
                  </Text>
                </View>
              )}
            </View>
            <View style={npStyle.progressArea}>
              <TouchableOpacity
                style={npStyle.progressTrack}
                onPress={(e) => {
                  seekTo(e.nativeEvent.locationX / (SW - spacing.xl * 2));
                }}
              >
                <View
                  style={[
                    npStyle.progressFill,
                    {
                      width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                    },
                  ]}
                >
                  <View style={npStyle.progressThumb} />
                </View>
              </TouchableOpacity>
              <View style={npStyle.timeRow}>
                <Text style={npStyle.timeTxt}>{fmtTime(position)}</Text>
                <Text style={npStyle.timeTxt}>{fmtTime(duration)}</Text>
              </View>
            </View>
            <View style={npStyle.controls}>
              <TouchableOpacity
                style={npStyle.ctrlBtn}
                onPress={() =>
                  seekTo(Math.max(0, (position - 15000) / duration))
                }
              >
                <Ionicons name="play-back" size={26} color={colors.textMuted} />
                <Text style={npStyle.ctrlHint}>15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={npStyle.playBtn}
                onPress={() => playingBhajan && playBhajan(playingBhajan)}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color={colors.bgSecondary} />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={36}
                    color={colors.bgSecondary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={npStyle.ctrlBtn}
                onPress={() =>
                  seekTo(Math.min(1, (position + 15000) / duration))
                }
              >
                <Ionicons
                  name="play-forward"
                  size={26}
                  color={colors.textMuted}
                />
                <Text style={npStyle.ctrlHint}>15s</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={npStyle.stopBtn}
              onPress={() => {
                stopPlayback();
                setShowNowPlaying(false);
              }}
            >
              <Ionicons
                name="stop-circle-outline"
                size={20}
                color={colors.textMuted}
              />
              <Text style={npStyle.stopTxt}>रोकें · Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════ YOUTUBE MODAL ════════════ */}
      <Modal
        visible={showYoutube}
        animationType="slide"
        onRequestClose={() => setShowYoutube(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
          <View style={ytStyle.ytHeader}>
            <TouchableOpacity
              onPress={() => setShowYoutube(false)}
              style={ytStyle.ytBack}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={ytStyle.ytTitleArea}>
              <Ionicons name="logo-youtube" size={20} color="#FF0000" />
              <Text style={ytStyle.ytHeaderTxt}>YouTube</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <YouTubeWebView url={ytUrl} />
        </View>
      </Modal>
    </GradientBackground>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerHi: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
  },
  headerEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  importHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.gold + "15",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold + "40",
  },
  importHeaderTxt: { fontSize: 13, color: colors.gold, fontWeight: "600" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    gap: 1,
    position: "relative",
  },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.gold },
  tabLabelHi: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  tabLabelEn: { fontSize: 9, color: colors.textMuted },
  tabLabelActive: { color: colors.gold },
  tabBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.gold,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeTxt: { fontSize: 9, color: colors.bgSecondary, fontWeight: "bold" },
  filterBar: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "80",
  },
  filterScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterBtn: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 56,
  },
  filterBtnActive: {
    backgroundColor: colors.gold + "20",
    borderColor: colors.gold,
  },
  filterIcon: { fontSize: 14 },
  filterTxtHi: { fontSize: 10, color: colors.textMuted, fontWeight: "600" },
  filterTxtEn: { fontSize: 9, color: colors.textMuted },
  filterTxtActive: { color: colors.gold },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  bhajanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bhajanCardActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold + "08",
  },
  discWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  bhajanInfo: { flex: 1 },
  bhajanTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bhajanTitleActive: { color: colors.gold },
  bhajanArtist: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  bhajanMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  deityPill: {
    backgroundColor: colors.gold + "15",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.gold + "40",
  },
  deityPillTxt: { fontSize: 10, color: colors.gold },
  durationTxt: { fontSize: 10, color: colors.textMuted },
  bhajanActions: { alignItems: "center", gap: 4 },
  artistsHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  artistsHeaderHi: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
  },
  artistsHeaderEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  artistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  artistEmojiBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  artistEmoji: { fontSize: 26 },
  artistInfo: { flex: 1 },
  artistName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  artistNameHi: { fontSize: 11, color: colors.gold, marginBottom: 2 },
  artistDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  artistTagRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  artistTag: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  artistTagTxt: { fontSize: 10, fontWeight: "600" },
  ytBtnWrap: { marginLeft: spacing.sm },
  ytBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF000020",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF000040",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: 14,
    margin: spacing.md,
    paddingVertical: spacing.md,
  },
  importBtnTxt: {
    fontSize: typography.fontSize.md,
    color: colors.bgSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyHi: {
    fontSize: typography.fontSize.lg,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontWeight: "600",
  },
  emptyEn: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted + "80",
    marginTop: 4,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted + "60",
    marginTop: 8,
    textAlign: "center",
  },
  // ── Mini Player ──────────────────────────────────────────────────────────
  miniBar: {
    // position is NOT absolute anymore — it's a flex child sitting below tab content
    // This guarantees it shows on every tab without any z-index tricks
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.gold + "40",
  },
  miniBarInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  miniBarInfo: { flex: 1 },
  miniBarTitle: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  miniBarArtist: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  miniProgress: {
    height: 3,
    backgroundColor: colors.cardBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  miniControls: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniControlBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ytTabContent: { padding: spacing.lg },
  ytTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
    marginBottom: 2,
  },
  ytSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  ytSectionLabel: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  ytChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  ytChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ytChipTxt: { fontSize: 12, color: colors.textPrimary },
  ytTrendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "60",
    gap: spacing.md,
  },
  ytTrendIcon: { fontSize: 22, width: 30, textAlign: "center" },
  ytTrendTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  ytNote: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  ytNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

const npStyle = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted + "60",
    marginTop: 10,
  },
  closeBtn: {
    alignSelf: "flex-start",
    marginLeft: spacing.lg,
    marginTop: spacing.sm,
    padding: 4,
  },
  discArea: {
    marginVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  trackTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  deityBadge: {
    backgroundColor: colors.gold + "20",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.gold + "50",
  },
  deityTxt: { fontSize: 12, color: colors.gold },
  progressArea: {
    width: "100%",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.gold,
    borderRadius: 3,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  progressThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gold,
    marginRight: -7,
    shadowColor: colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  timeTxt: { fontSize: 12, color: colors.textMuted },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  ctrlBtn: { alignItems: "center", gap: 2 },
  ctrlHint: { fontSize: 9, color: colors.textMuted },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stopTxt: { fontSize: 13, color: colors.textMuted },
});

const ytStyle = StyleSheet.create({
  ytHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F0F0F",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  ytBack: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ytTitleArea: { flexDirection: "row", alignItems: "center", gap: 8 },
  ytHeaderTxt: {
    color: "white",
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
  },
});
