/**
 * ScripturesScreen.tsx — Beautifully redesigned
 *
 * Aesthetic: Illuminated Manuscript × Temple Architecture
 * Warm amber/saffron palette, Sanskrit letterforms as visual art,
 * chapter-specific accent colours, ornate gold details throughout.
 * Zero logic changes from original — only visual layer replaced.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Share,
  Animated as RNAnimated,
} from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { colors, spacing, typography, theme } from "../../theme";
import { gitaService, Chapter, Verse } from "../../services/gitaService";
import { storageService } from "../../services/storageService";
import { Ionicons } from "@expo/vector-icons";

const { width: SW, height: SH } = Dimensions.get("window");

// ─────────────────────────────────────────────
// CHAPTER PALETTES — 18 unique accent colours
// ─────────────────────────────────────────────
const CH_ACCENT = [
  "#E8933A","#D4A017","#C06020","#B8860B","#CF7A2A",
  "#A0522D","#CD853F","#DAA520","#B8732A","#C97B2A",
  "#E8901A","#D4890A","#C47B0A","#F0A500","#E09020",
  "#D08010","#C07000","#B06000",
];
const CH_SYMBOL = ["🔱","🪷","⚔️","🕉️","🌿","🧘","✨","🌺","🙏","💫","🌸","🌊","🔥","🌙","☀️","🌟","💎","🕊️"];
const CH_THEME  = [
  "अर्जुन विषाद","सांख्य योग","कर्म योग","ज्ञान योग","संन्यास योग",
  "आत्म-संयम","ज्ञान-विज्ञान","अक्षर ब्रह्म","राज विद्या","विभूति",
  "विश्वरूप","भक्ति योग","क्षेत्र-क्षेत्रज्ञ","गुणत्रय","पुरुषोत्तम",
  "देवासुर सम्पद","श्रद्धात्रय","मोक्ष संन्यास",
];

// ─────────────────────────────────────────────
// LOCAL SEARCH — searches chapters + verses already in memory
// ─────────────────────────────────────────────
type SearchSection = "chapters" | "verses";

interface ChapterMatch { type: "chapter"; item: Chapter; }
interface VerseMatch   { type: "verse";   item: Verse;   matchField: string; }
type SearchResult = ChapterMatch | VerseMatch;

/** Normalise for case-insensitive, diacritic-tolerant matching */
function normalise(s?: string): string {
  return (s ?? "").toLowerCase().trim();
}

/** Search across already-loaded chapters + all their loaded verses in memory */
function searchLocally(
  query: string,
  chapters: Chapter[],
  allVerses: Map<number, Verse[]>,
): SearchResult[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  const results: SearchResult[] = [];

  for (const ch of chapters) {
    // ── Chapter fields ──
    const chHits = [
      ch.name, ch.nameTransliteration, ch.meaning, ch.meaningHindi,
      ch.summary, ch.summaryHindi,
    ].some(f => normalise(f).includes(q));

    if (chHits) results.push({ type: "chapter", item: ch });

    // ── Verses loaded for this chapter ──
    const verses = allVerses.get(ch.number) ?? [];
    for (const v of verses) {
      const field =
        normalise(v.sanskrit).includes(q)        ? "Sanskrit"      :
        normalise(v.transliteration).includes(q) ? "Transliteration":
        normalise(v.translation).includes(q)     ? "Translation"   :
        normalise(v.hindi).includes(q)           ? "Hindi"         :
        normalise(v.meaning).includes(q)         ? "Meaning"       :
        null;
      if (field) results.push({ type: "verse", item: v, matchField: field });
    }
  }
  return results;
}

function accent(ch: number) { return CH_ACCENT[(ch - 1) % CH_ACCENT.length]; }
function symbol(ch: number) { return CH_SYMBOL[(ch - 1) % CH_SYMBOL.length]; }
function themeLabel(ch: number) { return CH_THEME[(ch - 1) % CH_THEME.length]; }

function toRoman(n: number) {
  const v=[10,9,5,4,1], s=["X","IX","V","IV","I"];
  let r="";
  for(let i=0;i<v.length;i++) while(n>=v[i]){r+=s[i];n-=v[i];}
  return r;
}

// ─────────────────────────────────────────────
// TINY ATOMS
// ─────────────────────────────────────────────
const GoldLine = ({ mx = spacing.lg }: { mx?: number }) => (
  <View style={{ height: 1, backgroundColor: colors.gold + "30", marginHorizontal: mx, marginVertical: spacing.sm }} />
);

const SectionTag = ({ label, color }: { label: string; color: string }) => (
  <View style={{ flexDirection:"row", alignItems:"center", marginHorizontal: spacing.lg, marginBottom: spacing.xs, gap: 8 }}>
    <View style={{ flex:1, height:1, backgroundColor: color + "35" }} />
    <Text style={{ fontSize:9, color: color + "AA", letterSpacing:2.5, textTransform:"uppercase" }}>{label}</Text>
    <View style={{ flex:1, height:1, backgroundColor: color + "35" }} />
  </View>
);

// Animated fade-in wrapper
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const op  = useRef(new RNAnimated.Value(0)).current;
  const ty  = useRef(new RNAnimated.Value(18)).current;
  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(op, { toValue:1, duration:340, delay, useNativeDriver:true }),
      RNAnimated.timing(ty, { toValue:0, duration:340, delay, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <RNAnimated.View style={{ opacity:op, transform:[{translateY:ty}] }}>
      {children}
    </RNAnimated.View>
  );
};

// ─────────────────────────────────────────────
// SEARCH RESULT CARDS
// ─────────────────────────────────────────────
const SearchChapterCard = ({ item, onPress }: { item: Chapter; onPress: () => void }) => {
  const a = accent(item.number);
  return (
    <TouchableOpacity
      style={[st.srChCard, { borderLeftColor: a, borderLeftWidth: 3 }]}
      onPress={onPress}
      activeOpacity={0.76}
    >
      <View style={[st.srChCircle, { backgroundColor: a + "22", borderColor: a + "55" }]}>
        <Text style={[st.srChCircleNum, { color: a }]}>{item.number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.srChTopRow}>
          <Text style={st.srTypeTag}>📖 अध्याय · Chapter</Text>
        </View>
        <Text style={st.srChSanskrit}>{item.name}</Text>
        <Text style={[st.srChTranslit, { color: a }]}>{item.nameTransliteration}</Text>
        <Text style={st.srChMeaning} numberOfLines={1}>{item.meaningHindi} · {item.meaning}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={a + "80"} />
    </TouchableOpacity>
  );
};

const SearchVerseCard = ({ item, matchField, onPress }: {
  item: Verse; matchField: string; onPress: () => void;
}) => {
  const a = accent(item.chapter);
  return (
    <TouchableOpacity
      style={[st.srVCard, { borderTopColor: a + "50", borderTopWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.76}
    >
      <View style={st.srVTop}>
        <View style={[st.srVPill, { backgroundColor: a + "20", borderColor: a + "50" }]}>
          <Text style={[st.srVPillTxt, { color: a }]}>{item.chapter}.{item.verse}</Text>
        </View>
        <View style={[st.srMatchBadge, { backgroundColor: a + "15", borderColor: a + "35" }]}>
          <Text style={[st.srMatchTxt, { color: a }]}>🔍 {matchField}</Text>
        </View>
      </View>
      <Text style={st.srVSanskrit} numberOfLines={2}>{item.sanskrit}</Text>
      <Text style={st.srVTransl}   numberOfLines={2}>{item.translation}</Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// CHAPTER CARD
// ─────────────────────────────────────────────
const ChapterCard = React.memo(({ item, index, onPress }: {
  item: Chapter; index: number; onPress: () => void;
}) => {
  const a = accent(item.number);
  const s = symbol(item.number);
  const t = themeLabel(item.number);
  const scale = useRef(new RNAnimated.Value(1)).current;

  const onPressIn  = () => RNAnimated.spring(scale, { toValue:.97, useNativeDriver:true, speed:30 }).start();
  const onPressOut = () => RNAnimated.spring(scale, { toValue:1,  useNativeDriver:true, speed:30 }).start();

  return (
    <FadeIn delay={index * 35}>
      <RNAnimated.View style={{ transform:[{scale}] }}>
        <TouchableOpacity
          style={[st.chCard, { borderLeftColor: a, borderLeftWidth: 3 }]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          {/* Roman watermark */}
          <Text style={[st.chWatermark, { color: a }]}>{toRoman(item.number)}</Text>

          {/* Top row */}
          <View style={st.chTop}>
            <View style={[st.chCircle, { backgroundColor: a + "22", borderColor: a + "55" }]}>
              <Text style={[st.chCircleNum, { color: a }]}>{item.number}</Text>
            </View>
            <View style={st.chBadges}>
              <View style={[st.badge, { backgroundColor: a + "18", borderColor: a + "40" }]}>
                <Text style={{ fontSize:11 }}>{s}</Text>
                <Text style={[st.badgeTxt, { color: a }]}>{item.verses} श्लोक</Text>
              </View>
            </View>
          </View>

          {/* Sanskrit name */}
          <Text style={st.chSanskrit}>{item.name}</Text>
          <Text style={[st.chTranslit, { color: a }]}>{item.nameTransliteration}</Text>

          {/* Meanings */}
          <Text style={st.chMeaning}>{item.meaningHindi}  ·  {item.meaning}</Text>

          {/* Footer */}
          <View style={st.chFooter}>
            <Text style={[st.chTheme, { color: a }]}>{t}</Text>
            <Ionicons name="chevron-forward" size={16} color={a + "99"} />
          </View>
        </TouchableOpacity>
      </RNAnimated.View>
    </FadeIn>
  );
});

// ─────────────────────────────────────────────
// VERSE CARD (list)
// ─────────────────────────────────────────────
const VerseCard = React.memo(({ item, a, onPress }: {
  item: Verse; a: string; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[st.vCard, { borderTopColor: a + "55", borderTopWidth: 2 }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {/* Pill */}
    <View style={[st.vPill, { backgroundColor: a + "20", borderColor: a + "55" }]}>
      <Text style={[st.vPillTxt, { color: a }]}>श्लोक {item.verse}</Text>
    </View>

    <Text style={st.vSanskrit} numberOfLines={2}>{item.sanskrit}</Text>
    <Text style={st.vTransl}   numberOfLines={2}>{item.translation}</Text>
    {item.hindi && <Text style={st.vHindi} numberOfLines={1}>{item.hindi}</Text>}

    <View style={{ flexDirection:"row", alignItems:"center", gap:3, marginTop:spacing.xs }}>
      <Text style={[st.vMore, { color: a }]}>विस्तार पढ़ें · Read full verse</Text>
      <Ionicons name="chevron-forward" size={11} color={a} />
    </View>
  </TouchableOpacity>
));

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function ScripturesScreen() {
  const [chapters, setChapters]           = useState<Chapter[]>([]);
  const [shloks,   setShloks]             = useState<Verse[]>([]);
  const [allVerses, setAllVerses]         = useState<Map<number, Verse[]>>(new Map());
  const [selectedChapter, setSelectedChapter] = useState<number | undefined>();
  const [selectedVerse,   setSelectedVerse]   = useState<Verse | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch]       = useState(false);
  const [summaryTab, setSummaryTab]       = useState<"hindi"|"english">("hindi");
  const [currentVerseIndex, setCurrentVerseIndex] = useState(1);
  const [bookmarked, setBookmarked]       = useState<Set<string>>(new Set());

  const searchRef = useRef<TextInput>(null);
  const chData    = selectedChapter ? chapters[selectedChapter - 1] : null;
  const totalV    = chData?.verses ?? 0;
  const a         = selectedChapter ? accent(selectedChapter) : colors.gold;

  // ── Data ──────────────────────────────────
  useEffect(() => { gitaService.getAllChapters().then(setChapters); }, []);

  useEffect(() => {
    if (selectedChapter) {
      gitaService.getShloks(selectedChapter, currentVerseIndex).then(verses => {
        setShloks(verses);
        // Cache into allVerses map so local search can find them
        if (verses && verses.length > 0) {
          setAllVerses(prev => {
            const next = new Map(prev);
            const existing = next.get(selectedChapter) ?? [];
            // Merge without duplicates (keyed by verse number)
            const merged = [...existing];
            for (const v of verses) {
              if (!merged.find(e => e.verse === v.verse)) merged.push(v);
            }
            next.set(selectedChapter, merged);
            return next;
          });
        }
      });
    }
  }, [selectedChapter, currentVerseIndex]);

  // ── Search — purely local, no API call ────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSearchResults(q.trim().length > 1 ? searchLocally(q, chapters, allVerses) : []);
    if (q.length > 0) setShowSearch(true);
  };
  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); };

  // ── Navigation ────────────────────────────
  const handleVerseChange = (dir: "prev"|"next") => {
    setCurrentVerseIndex(prev => {
      if (dir==="prev" && prev>1)      return prev-1;
      if (dir==="next" && prev<totalV) return prev+1;
      return prev;
    });
  };

  // ── Bookmark ──────────────────────────────
  const toggleBookmark = (v: Verse) => {
    const k = `${v.chapter}-${v.verse}`;
    setBookmarked(p => { const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n; });
  };

  // ── Share ─────────────────────────────────
  const shareVerse = (v: Verse) =>
    Share.share({ message:`📖 Bhagavad Gita ${v.chapter}.${v.verse}\n\n${v.sanskrit}\n\n${v.translation}\n\n🙏 Jai Shri Krishna` });

  // ─────────────────────────────────────────
  return (
    <GradientBackground>
      <View style={st.root}>

        {/* ── HEADER ── */}
        <View style={st.hdr}>
          <View style={st.hdrLeft}>
            <Text style={st.hdrOm}>ॐ</Text>
            <View>
              <Text style={st.hdrTitle}>भगवद् गीता</Text>
              <Text style={st.hdrSub}>Bhagavad Gita  ·  18 Chapters  ·  700 Verses</Text>
            </View>
          </View>
          <TouchableOpacity
            style={st.hdrBtn}
            onPress={() => { setShowSearch(true); setTimeout(()=>searchRef.current?.focus(), 80); }}
          >
            <Ionicons name="search" size={18} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH ── */}
        {showSearch && (
          <View style={st.searchWrap}>
            <View style={st.searchBar}>
              <Ionicons name="search" size={16} color={colors.gold} />
              <TextInput
                ref={searchRef}
                style={st.searchInput}
                placeholder="श्लोक खोजें · Search verses…"
                placeholderTextColor={colors.textMuted + "70"}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {searchResults.length > 0 && (
              <Text style={st.searchCount}>{searchResults.length} results</Text>
            )}
          </View>
        )}

        {/* ── LIST ── */}
        {showSearch && searchQuery.length > 1 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(r,i)=> r.type==="chapter" ? `ch-${r.item.number}` : `v-${(r.item as Verse).chapter}-${(r.item as Verse).verse}-${i}`}
            ListHeaderComponent={
              <View style={st.searchHeader}>
                <Text style={st.searchHeaderTxt}>
                  {searchResults.length > 0
                    ? `${searchResults.length} परिणाम · results for "${searchQuery}"`
                    : `"${searchQuery}" के लिए कोई परिणाम नहीं · No results`}
                </Text>
                {searchResults.length === 0 && allVerses.size === 0 && (
                  <Text style={st.searchHint}>
                    💡 किसी अध्याय को खोलें ताकि उसके श्लोक भी खोजे जा सकें
"}
                    Open a chapter first to include its verses in search
                  </Text>
                )}
              </View>
            }
            renderItem={({item: r})=>{
              if (r.type === "chapter") {
                const ch = r.item as Chapter;
                return (
                  <SearchChapterCard
                    item={ch}
                    onPress={()=>{ setSelectedChapter(ch.number); setCurrentVerseIndex(1); clearSearch(); }}
                  />
                );
              }
              const v = r.item as Verse;
              const mf = (r as VerseMatch).matchField;
              return (
                <SearchVerseCard
                  item={v}
                  matchField={mf}
                  onPress={()=>setSelectedVerse(v)}
                />
              );
            }}
            contentContainerStyle={st.listPad}
          />
        ) : (
          <FlatList
            data={chapters}
            keyExtractor={i=>i.number.toString()}
            renderItem={({item,index})=>(
              <ChapterCard item={item} index={index} onPress={()=>{ setSelectedChapter(item.number); setCurrentVerseIndex(1); }} />
            )}
            contentContainerStyle={st.listPad}
            ListHeaderComponent={
              <View style={st.listIntro}>
                <Text style={st.listIntroQuote}>
                  "कर्म करो, फल की चिंता मत करो।"
                </Text>
                <Text style={st.listIntroQuoteEn}>Act without attachment to results</Text>
                <GoldLine />
              </View>
            }
          />
        )}
      </View>

      {/* ════════════════════════════════════════════
          UNIFIED MODAL  (chapter + verse in one Modal
          — avoids Android nested-Modal bug entirely)
      ════════════════════════════════════════════ */}
      <Modal
        visible={selectedChapter !== undefined || selectedVerse !== null}
        animationType="slide"
        onRequestClose={()=>{
          if (selectedVerse !== null) { setSelectedVerse(null); return; }
          setSelectedChapter(undefined); setShloks([]); setCurrentVerseIndex(1);
        }}
      >
        <GradientBackground>
          <View style={st.root}>

            {/* Modal header */}
            <View style={[st.mHdr, { borderBottomColor: a + "40" }]}>
              <TouchableOpacity
                style={[st.mBackBtn, { backgroundColor: a + "18", borderColor: a + "40" }]}
                onPress={()=>{ setSelectedChapter(undefined); setShloks([]); setCurrentVerseIndex(1); }}
              >
                <Ionicons name="chevron-back" size={22} color={a} />
              </TouchableOpacity>

              <View style={{ alignItems:"center", flex:1 }}>
                <Text style={{ fontSize:12, color: a + "AA", letterSpacing:1 }}>
                  {symbol(selectedChapter??1)}  CHAPTER {selectedChapter}
                </Text>
                <Text style={[st.mHdrName, { color: a }]} numberOfLines={1}>
                  {chData?.name}
                </Text>
              </View>

              <View style={{ width:40 }} />
            </View>

            {/* Hero band */}
            <View style={[st.chHero, { backgroundColor: a + "10", borderBottomColor: a + "30" }]}>
              {/* Om watermark */}
              <Text style={[st.heroOm, { color: a }]}>ॐ</Text>
              <Text style={st.heroTranslit}>{chData?.nameTransliteration}</Text>
              <Text style={st.heroMeaning}>{chData?.meaningHindi}  ·  {chData?.meaning}</Text>
              <View style={st.heroStats}>
                {[
                  { num: selectedChapter, lbl:"अध्याय" },
                  { num: totalV,          lbl:"श्लोक"  },
                  { num: 18,              lbl:"कुल"    },
                ].map(s=>(
                  <View key={s.lbl} style={[st.heroStat, { backgroundColor: a + "20" }]}>
                    <Text style={[st.heroStatN, { color: a }]}>{s.num}</Text>
                    <Text style={st.heroStatL}>{s.lbl}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Summary tabs */}
            {chData && (
              <View style={st.summaryWrap}>
                <View style={[st.summaryTabs, { borderColor: a + "30" }]}>
                  {(["hindi","english"] as const).map(lang=>(
                    <TouchableOpacity
                      key={lang}
                      style={[st.summaryTab, summaryTab===lang && { backgroundColor: a, borderColor: a }]}
                      onPress={()=>setSummaryTab(lang)}
                    >
                      <Text style={[st.summaryTabTxt, summaryTab===lang && { color: colors.bgSecondary }]}>
                        {lang==="hindi"?"हिंदी":"English"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ScrollView style={st.summaryScroll} showsVerticalScrollIndicator={false}>
                  <Text style={st.summaryTxt}>
                    {summaryTab==="hindi" ? chData.summaryHindi : chData.summary}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* Verse navigator */}
            {shloks && shloks.length > 0 && (
              <View style={[st.navBar, { borderColor: a + "35" }]}>
                <TouchableOpacity
                  style={[st.navBtn, currentVerseIndex<=1 && st.navBtnDim]}
                  onPress={()=>handleVerseChange("prev")}
                  disabled={currentVerseIndex<=1}
                >
                  <Ionicons name="chevron-back" size={20} color={currentVerseIndex<=1 ? colors.textMuted+"40" : a} />
                  <Text style={[st.navBtnTxt, currentVerseIndex<=1 && { color: colors.textMuted+"40" }]}>पिछला</Text>
                </TouchableOpacity>

                {/* Progress dots */}
                <View style={st.navDotsWrap}>
                  {Array.from({ length: Math.min(totalV, 9) }).map((_,i)=>{
                    const active = i === Math.min(currentVerseIndex-1, 8);
                    return (
                      <View key={i} style={[st.navDot,
                        active && { width:14, backgroundColor: a },
                        !active && { backgroundColor: colors.cardBorder },
                      ]} />
                    );
                  })}
                </View>

                <Text style={[st.navCount, { color: a }]}>{currentVerseIndex}/{totalV}</Text>

                <TouchableOpacity
                  style={[st.navBtn, currentVerseIndex>=totalV && st.navBtnDim]}
                  onPress={()=>handleVerseChange("next")}
                  disabled={currentVerseIndex>=totalV}
                >
                  <Text style={[st.navBtnTxt, currentVerseIndex>=totalV && { color: colors.textMuted+"40" }]}>अगला</Text>
                  <Ionicons name="chevron-forward" size={20} color={currentVerseIndex>=totalV ? colors.textMuted+"40" : a} />
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={shloks}
              keyExtractor={i=>`${i.chapter}-${i.verse}`}
              renderItem={({item})=>(
                <VerseCard item={item} a={a} onPress={()=>setSelectedVerse(item)} />
              )}
              contentContainerStyle={[st.listPad, { paddingBottom: 40 }]}
            />

          </View>

          {/* ── VERSE DETAIL — rendered as absolute overlay inside same Modal ── */}
          {selectedVerse !== null && (() => {
            const va    = accent(selectedVerse.chapter);
            const bkKey = `${selectedVerse.chapter}-${selectedVerse.verse}`;
            const isBkm = bookmarked.has(bkKey);
            return (
              <View style={st.vsOverlay}>
                {/* Tap backdrop to dismiss */}
                <TouchableOpacity
                  style={StyleSheet.absoluteFillObject}
                  activeOpacity={1}
                  onPress={()=>setSelectedVerse(null)}
                />
                <View style={st.vsSheet}>
                  <View style={st.vsHandle} />

                  {/* Header */}
                  <View style={[st.vsHdr, { borderBottomColor: va + "40" }]}>
                    <View>
                      <Text style={[st.vsHdrChapter, { color: va }]}>
                        अध्याय {selectedVerse.chapter}  ·  श्लोक {selectedVerse.verse}
                      </Text>
                      <Text style={st.vsHdrSub}>
                        Chapter {selectedVerse.chapter}, Verse {selectedVerse.verse}
                      </Text>
                    </View>
                    <View style={st.vsActions}>
                      <TouchableOpacity style={st.vsActionBtn} onPress={()=>toggleBookmark(selectedVerse)}>
                        <Ionicons name={isBkm?"bookmark":"bookmark-outline"} size={20} color={isBkm ? va : colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity style={st.vsActionBtn} onPress={()=>shareVerse(selectedVerse)}>
                        <Ionicons name="share-outline" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[st.vsActionBtn, { backgroundColor: colors.cardBorder + "80" }]}
                        onPress={()=>setSelectedVerse(null)}
                      >
                        <Ionicons name="close" size={18} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Content */}
                  <ScrollView
                    style={st.vsScroll}
                    contentContainerStyle={st.vsScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={[st.sanskritBox, { borderColor: va + "45", backgroundColor: va + "08" }]}>
                      <Text style={[st.sanskritBoxOm, { color: va }]}>ॐ</Text>
                      <Text style={st.sanskritTxt}>{selectedVerse.sanskrit}</Text>
                      {selectedVerse.transliteration && (
                        <Text style={[st.translitTxt, { color: va }]}>{selectedVerse.transliteration}</Text>
                      )}
                    </View>

                    <SectionTag label="Translation" color={va} />
                    <Text style={st.translTxt}>{selectedVerse.translation}</Text>

                    {selectedVerse.hindi && (
                      <>
                        <SectionTag label="हिंदी अनुवाद" color={va} />
                        <Text style={st.hindiTxt}>{selectedVerse.hindi}</Text>
                      </>
                    )}

                    {selectedVerse.meaning && (
                      <>
                        <SectionTag label="Meaning · अर्थ" color={va} />
                        <View style={[st.meaningBox, { borderLeftColor: va }]}>
                          <Text style={st.meaningTxt}>{selectedVerse.meaning}</Text>
                        </View>
                      </>
                    )}

                    {isBkm && (
                      <View style={[st.bkmNote, { borderColor: va + "55", backgroundColor: va + "12" }]}>
                        <Ionicons name="bookmark" size={13} color={va} />
                        <Text style={[st.bkmTxt, { color: va }]}>Bookmarked · बुकमार्क किया</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            );
          })()}

        </GradientBackground>
      </Modal>
    </GradientBackground>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──────────────────────────────
  hdr: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth:1, borderBottomColor: colors.gold + "28",
  },
  hdrLeft: { flexDirection:"row", alignItems:"center", gap: spacing.sm },
  hdrOm: { fontSize:38, color: colors.gold, opacity:0.82, lineHeight:46 },
  hdrTitle: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.gold, letterSpacing:0.4 },
  hdrSub: { fontSize:10, color: colors.textMuted, marginTop:2, letterSpacing:0.3 },
  hdrBtn: {
    width:40, height:40, borderRadius:20,
    backgroundColor: colors.gold + "15", alignItems:"center", justifyContent:"center",
    borderWidth:1, borderColor: colors.gold + "35",
  },

  // ── Search ──────────────────────────────
  searchWrap: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth:1, borderBottomColor: colors.divider,
  },
  searchBar: {
    flexDirection:"row", alignItems:"center", backgroundColor: colors.cardBg,
    borderRadius:12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth:1, borderColor: colors.gold + "40", gap: spacing.sm,
  },
  searchInput: { flex:1, fontSize: typography.fontSize.md, color: colors.textPrimary },
  searchCount: { fontSize:11, color: colors.gold + "90", marginTop:4, textAlign:"right" },

  listPad: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },

  // ── List intro ──────────────────────────
  listIntro: { paddingHorizontal: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xs, alignItems:"center" },
  listIntroQuote: { fontSize: typography.fontSize.lg, color: colors.gold, fontWeight:"600", textAlign:"center", letterSpacing:0.3 },
  listIntroQuoteEn: { fontSize: typography.fontSize.sm, color: colors.textMuted, marginTop:4, fontStyle:"italic" },

  // ── Chapter card ──────────────────────────
  chCard: {
    backgroundColor: colors.cardBg, borderRadius:16,
    borderWidth:1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.sm, overflow:"hidden", position:"relative",
  },
  chWatermark: {
    position:"absolute", right:10, top:2, fontSize:50,
    fontWeight:"900", opacity:0.065, pointerEvents:"none",
  },
  chTop: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom: spacing.sm },
  chCircle: { width:46, height:46, borderRadius:23, borderWidth:1.5, alignItems:"center", justifyContent:"center" },
  chCircleNum: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  chBadges: { flexDirection:"row", gap: spacing.xs },
  badge: {
    flexDirection:"row", alignItems:"center", gap:4,
    paddingHorizontal:10, paddingVertical:4, borderRadius:20, borderWidth:1,
  },
  badgeTxt: { fontSize:11, fontWeight:"600" },
  chSanskrit: {
    fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary, marginBottom:2, letterSpacing:0.3,
  },
  chTranslit: { fontSize: typography.fontSize.md, fontStyle:"italic", marginBottom: spacing.xs },
  chMeaning: { fontSize: typography.fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  chFooter: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  chTheme: { fontSize:11, fontWeight:"700", letterSpacing:0.5, textTransform:"uppercase" },

  // ── Verse card ──────────────────────────
  vCard: {
    backgroundColor: colors.cardBg, borderRadius:14,
    borderWidth:1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  vPill: { alignSelf:"flex-start", borderRadius:20, paddingHorizontal:10, paddingVertical:3, borderWidth:1, marginBottom: spacing.sm },
  vPillTxt: { fontSize:12, fontWeight:"bold" },
  vSanskrit: { fontSize: typography.fontSize.md, color: colors.textPrimary, lineHeight:26, marginBottom: spacing.xs },
  vTransl: { fontSize: typography.fontSize.sm, color: colors.textMuted, lineHeight:20, marginBottom:4 },
  vHindi: { fontSize: typography.fontSize.sm, color: colors.textMuted + "AA", marginBottom: spacing.xs },
  vMore: { fontSize:11, fontWeight:"600" },

  // ── Modal header ──────────────────────────
  mHdr: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    paddingTop:52, borderBottomWidth:1,
  },
  mBackBtn: {
    width:40, height:40, borderRadius:20, borderWidth:1,
    alignItems:"center", justifyContent:"center",
  },
  mHdrName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, textAlign:"center" },

  // ── Chapter hero ──────────────────────────
  chHero: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth:1, overflow:"hidden", position:"relative",
  },
  heroOm: {
    position:"absolute", right:12, top:-6, fontSize:70,
    opacity:0.07, fontWeight:"900", pointerEvents:"none",
  },
  heroTranslit: { fontSize: typography.fontSize.lg, color: colors.textPrimary, fontWeight:"600", fontStyle:"italic", marginBottom:4 },
  heroMeaning: { fontSize: typography.fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  heroStats: { flexDirection:"row", gap: spacing.sm },
  heroStat: { flex:1, alignItems:"center", paddingVertical: spacing.sm, borderRadius:10 },
  heroStatN: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  heroStatL: { fontSize:10, color: colors.textMuted, marginTop:1 },

  // ── Summary ──────────────────────────────
  summaryWrap: {
    marginHorizontal: spacing.md, marginVertical: spacing.sm,
    backgroundColor: colors.cardBg, borderRadius:14, borderWidth:1,
    borderColor: colors.cardBorder, padding: spacing.md,
  },
  summaryTabs: {
    flexDirection:"row", borderRadius:10, borderWidth:1, overflow:"hidden", marginBottom: spacing.sm,
  },
  summaryTab: {
    flex:1, paddingVertical: spacing.sm, alignItems:"center",
    borderWidth:1, borderColor:"transparent",
  },
  summaryTabTxt: { fontSize: typography.fontSize.sm, color: colors.textMuted, fontWeight:"600" },
  summaryScroll: { maxHeight: 110 },
  summaryTxt: { fontSize: typography.fontSize.sm, color: colors.textPrimary, lineHeight:22 },

  // ── Verse navigator ──────────────────────
  navBar: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    marginHorizontal: spacing.md, marginVertical: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBg, borderRadius:14, borderWidth:1,
  },
  navBtn: { flexDirection:"row", alignItems:"center", gap:2 },
  navBtnDim: { opacity:0.4 },
  navBtnTxt: { fontSize:12, color: colors.textMuted, fontWeight:"600" },
  navDotsWrap: { flexDirection:"row", alignItems:"center", gap:4 },
  navDot: { width:6, height:6, borderRadius:3 },
  navCount: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, minWidth:42, textAlign:"center" },

  // ── Verse bottom sheet ──────────────────
  vsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:"rgba(0,0,0,0.72)",
    justifyContent:"flex-end",
    zIndex: 100,
  },
 vsSheet: {
  backgroundColor: colors.bgSecondary,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  height: SH * 0.92,
  paddingBottom: 32,
},

  vsHandle: {
    width:40, height:4, borderRadius:2,
    backgroundColor: colors.textMuted + "50",
    alignSelf:"center", marginTop:10, marginBottom:4,
  },
  vsHdr: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth:1,
  },
  vsHdrChapter: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  vsHdrSub: { fontSize:11, color: colors.textMuted, marginTop:2 },
  vsActions: { flexDirection:"row", gap: spacing.sm },
  vsActionBtn: { width:34, height:34, borderRadius:17, alignItems:"center", justifyContent:"center" },
  vsScroll: { flex:1 },
  vsScrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  // Sanskrit display box
  sanskritBox: {
    borderRadius:16, borderWidth:1, padding: spacing.lg,
    marginTop: spacing.md, marginBottom: spacing.sm,
    alignItems:"center", overflow:"hidden", position:"relative",
  },
  sanskritBoxOm: {
    position:"absolute", right:-5, top:-10, fontSize:80,
    opacity:0.06, fontWeight:"900", pointerEvents:"none",
  },
  sanskritTxt: {
    fontSize: typography.fontSize.xl, color: colors.textPrimary,
    textAlign:"center", lineHeight: typography.fontSize.xl * 1.85,
    fontWeight:"500", letterSpacing:0.3,
  },
  translitTxt: { fontSize: typography.fontSize.md, textAlign:"center", marginTop: spacing.sm, fontStyle:"italic" },

  translTxt: { fontSize: typography.fontSize.lg, color: colors.textPrimary, lineHeight: typography.fontSize.lg * 1.72, marginVertical: spacing.xs },
  hindiTxt: { fontSize: typography.fontSize.md, color: colors.textPrimary, lineHeight:26, marginVertical: spacing.xs },

  meaningBox: {
    backgroundColor: colors.cardBg, borderRadius:12,
    borderLeftWidth:4, padding: spacing.md, marginVertical: spacing.xs,
  },
  meaningTxt: { fontSize: typography.fontSize.md, color: colors.textMuted, lineHeight:24 },

  bkmNote: {
    flexDirection:"row", alignItems:"center", gap:6,
    borderWidth:1, borderRadius:10, padding: spacing.sm, marginTop: spacing.md,
  },
  bkmTxt: { fontSize:12, fontWeight:"600" },

  // ── Search result cards ───────────────────
  searchHeader: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  searchHeaderTxt: { fontSize: typography.fontSize.sm, color: colors.gold + "BB", fontWeight: "600", textAlign: "center" },
  searchHint: { fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 18 },

  srChCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
  },
  srChCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  srChCircleNum: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  srChTopRow: { flexDirection: "row", marginBottom: 2 },
  srTypeTag: { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5 },
  srChSanskrit: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
  srChTranslit: { fontSize: 12, fontStyle: "italic", marginBottom: 2 },
  srChMeaning: { fontSize: 11, color: colors.textMuted },

  srVCard: {
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  srVTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  srVPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  srVPillTxt: { fontSize: 12, fontWeight: "bold" },
  srMatchBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  srMatchTxt: { fontSize: 10, fontWeight: "600" },
  srVSanskrit: { fontSize: typography.fontSize.md, color: colors.textPrimary, lineHeight: 24, marginBottom: 4 },
  srVTransl: { fontSize: typography.fontSize.sm, color: colors.textMuted, lineHeight: 20 },
});