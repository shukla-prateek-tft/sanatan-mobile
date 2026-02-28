/**
 * KundliScreen.tsx  — FIXED
 * Fix: form validation before submit (no empty field submission)
 */
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { colors, spacing, typography } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import {
  getPanchangam,
  Observer,
  rashiNames,
  nakshatraNames,
  tithiNames,
} from "@ishubhamx/panchangam-js";

const { width: SW } = Dimensions.get("window");
const TZ_OFFSET = new Date().getTimezoneOffset() * -1;

// ─────────────────────────────────────────────
// CONSTANTS & TRANSLATIONS
// ─────────────────────────────────────────────
const RASHI_EN = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
const RASHI_HI = [
  "मेष",
  "वृषभ",
  "मिथुन",
  "कर्क",
  "सिंह",
  "कन्या",
  "तुला",
  "वृश्चिक",
  "धनु",
  "मकर",
  "कुम्भ",
  "मीन",
];
const RASHI_SYMBOL = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

const PLANET_EN = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
];
const PLANET_HI = [
  "सूर्य",
  "चन्द्र",
  "मंगल",
  "बुध",
  "बृहस्पति",
  "शुक्र",
  "शनि",
  "राहु",
  "केतु",
];
const PLANET_KEY = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
];
const PLANET_ICON = ["☀️", "🌙", "🔴", "🟢", "🟡", "⚪", "⚫", "🐍", "🔱"];

const NAKSHATRA_HI = [
  "अश्विनी",
  "भरणी",
  "कृत्तिका",
  "रोहिणी",
  "मृगशिरा",
  "आर्द्रा",
  "पुनर्वसु",
  "पुष्य",
  "अश्लेषा",
  "मघा",
  "पूर्व फाल्गुनी",
  "उत्तर फाल्गुनी",
  "हस्त",
  "चित्रा",
  "स्वाती",
  "विशाखा",
  "अनुराधा",
  "ज्येष्ठा",
  "मूल",
  "पूर्व आषाढ़ा",
  "उत्तर आषाढ़ा",
  "श्रवण",
  "धनिष्ठा",
  "शतभिषा",
  "पूर्व भाद्रपदा",
  "उत्तर भाद्रपदा",
  "रेवती",
];
const VARNA_BY_RASHI = [
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
  "Kshatriya",
  "Vaishya",
  "Shudra",
  "Brahmin",
];
const NADI_BY_NAKSHATRA = Array.from({ length: 27 }, (_, i) =>
  i % 3 === 0 ? "Aadi" : i % 3 === 1 ? "Madhya" : "Antya",
);
const GANA_BY_NAKSHATRA = [
  "Deva",
  "Manushya",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Rakshasa",
  "Deva",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
  "Rakshasa",
  "Deva",
  "Rakshasa",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
];

const KUNDLI_POSITIONS: (number | null)[][] = [
  [1, 2, 3, 4],
  [12, null, null, 5],
  [11, null, null, 6],
  [10, 9, 8, 7],
];

const KOOTA_DATA = [
  { en: "Varna", hi: "वर्ण", max: 1 },
  { en: "Vasya", hi: "वास्य", max: 2 },
  { en: "Tara", hi: "तारा", max: 3 },
  { en: "Yoni", hi: "योनि", max: 4 },
  { en: "Maitri", hi: "ग्रह मैत्री", max: 5 },
  { en: "Gana", hi: "गण", max: 6 },
  { en: "Bhakoot", hi: "भकूट", max: 7 },
  { en: "Nadi", hi: "नाड़ी", max: 8 },
];

// ─────────────────────────────────────────────
// VALIDATION HELPER — FIX #1
// ─────────────────────────────────────────────
function validateBirthForm(f: BirthData): string | null {
  if (!f.day.trim() || !f.month.trim() || !f.year.trim()) {
    return "कृपया पूरी जन्म तिथि भरें · Please enter complete birth date (DD/MM/YYYY)";
  }
  const day = Number(f.day);
  const month = Number(f.month);
  const year = Number(f.year);
  if (isNaN(day) || day < 1 || day > 31) return "Invalid day (1–31)";
  if (isNaN(month) || month < 1 || month > 12) return "Invalid month (1–12)";
  if (isNaN(year) || year < 1900 || year > 2100)
    return "Invalid year (1900–2100)";
  if (!f.hour.trim() || !f.minute.trim()) {
    return "कृपया जन्म समय भरें · Please enter birth time (HH:MM)";
  }
  const hour = Number(f.hour);
  const minute = Number(f.minute);
  if (isNaN(hour) || hour < 0 || hour > 23) return "Invalid hour (0–23)";
  if (isNaN(minute) || minute < 0 || minute > 59)
    return "Invalid minute (0–59)";
  if (!f.lat.trim() || !f.lng.trim()) {
    return "कृपया जन्म स्थान चुनें · Please select birth place";
  }
  const lat = Number(f.lat);
  const lng = Number(f.lng);
  if (isNaN(lat) || lat < -90 || lat > 90) return "Invalid latitude";
  if (isNaN(lng) || lng < -180 || lng > 180) return "Invalid longitude";
  return null; // valid
}

// ─────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────
const SecDiv = ({ en, hi }: { en: string; hi: string }) => (
  <View style={st.secDiv}>
    <View style={st.secLine} />
    <View style={st.secPill}>
      <Text style={st.secHi}>{hi}</Text>
      <Text style={st.secEn}> · {en}</Text>
    </View>
    <View style={st.secLine} />
  </View>
);

const InfoRow = ({
  icon,
  labelEn,
  labelHi,
  valueEn,
  valueHi,
  accent,
}: {
  icon?: string;
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  accent?: boolean;
}) => (
  <View style={st.infoRow}>
    {icon ? (
      <Text style={st.infoIcon}>{icon}</Text>
    ) : (
      <View style={{ width: 22 }} />
    )}
    <View style={st.infoLabels}>
      <Text style={st.infoLabelHi}>{labelHi}</Text>
      <Text style={st.infoLabelEn}>{labelEn}</Text>
    </View>
    <View style={st.infoValues}>
      <Text style={[st.infoValueEn, accent && st.accent]}>{valueEn}</Text>
      {valueHi ? <Text style={st.infoValueHi}>{valueHi}</Text> : null}
    </View>
  </View>
);

// ─────────────────────────────────────────────
// KUNDLI CHART
// ─────────────────────────────────────────────
const KundliChart = ({
  planets,
  lagna,
}: {
  planets: Record<string, number>;
  lagna: number;
}) => {
  const cellSize = (SW - spacing.md * 2) / 4;
  const houseOccupants: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) houseOccupants[h] = [];
  PLANET_KEY.forEach((key, idx) => {
    const rashi = planets[key] ?? -1;
    if (rashi < 0) return;
    const house = ((rashi - lagna + 12) % 12) + 1;
    houseOccupants[house].push(PLANET_ICON[idx]);
  });
  return (
    <View style={st.kundliGrid}>
      {KUNDLI_POSITIONS.map((row, ri) => (
        <View key={ri} style={st.kundliRow}>
          {row.map((house, ci) => {
            if (house === null)
              return (
                <View
                  key={ci}
                  style={[
                    st.kundliCenterCell,
                    { width: cellSize * 2, height: cellSize * 2 },
                  ]}
                >
                  <Text style={st.kundliCenter}>कुंडली</Text>
                  <Text style={st.kundliCenterEn}>Kundli</Text>
                </View>
              );
            const isLagna = house === 1;
            const occ = houseOccupants[house] ?? [];
            const rashiIdx = (lagna + house - 2) % 12;
            return (
              <View
                key={ci}
                style={[
                  st.kundliCell,
                  { width: cellSize, height: cellSize },
                  isLagna && st.lagnaCell,
                ]}
              >
                <Text style={st.houseNum}>{house}</Text>
                <Text style={st.rashiSymbol}>{RASHI_SYMBOL[rashiIdx]}</Text>
                <Text style={st.rashiShort}>{RASHI_HI[rashiIdx]}</Text>
                <Text style={st.planetIcons}>{occ.join(" ")}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// BIRTH FORM
// ─────────────────────────────────────────────
interface BirthData {
  name: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  lat: string;
  lng: string;
  place: string;
}

const EMPTY_FORM: BirthData = {
  name: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  lat: "28.6139",
  lng: "77.2090",
  place: "New Delhi",
};

// ─────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────
export default function KundliScreen() {
  const [tab, setTab] = useState<"kundli" | "matching">("kundli");
  const [form, setForm] = useState<BirthData>(EMPTY_FORM);
  const [form2, setForm2] = useState<BirthData>({
    ...EMPTY_FORM,
    name: "Partner",
  });
  const [kundliData, setKundliData] = useState<any>(null);
  const [kundliData2, setKundliData2] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [expandDasha, setExpandDasha] = useState(false);

  const calcKundli = useCallback(async (f: BirthData, cb: (d: any) => void) => {
    // ── VALIDATION FIX ──────────────────────────
    const validErr = validateBirthForm(f);
    if (validErr) {
      setError(validErr);
      return;
    }
    // ────────────────────────────────────────────
    setLoading(true);
    setError("");
    try {
      const date = new Date(
        Number(f.year),
        Number(f.month) - 1,
        Number(f.day),
        Number(f.hour),
        Number(f.minute),
        0,
      );
      if (isNaN(date.getTime())) throw new Error("Invalid date/time");
      const observer = new Observer(Number(f.lat), Number(f.lng), 200);
      const data = getPanchangam(date, observer, { timezoneOffset: TZ_OFFSET });
      cb(data);
    } catch (e: any) {
      setError(e.message ?? "Calculation error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = () =>
    calcKundli(form, (d) => {
      setKundliData(d);
      setShowForm(false);
    });

  const handleMatching = async () => {
    // ── VALIDATION FIX (both forms) ─────────────
    const err1 = validateBirthForm(form);
    if (err1) {
      setError(`👨 Boy: ${err1}`);
      return;
    }
    const err2 = validateBirthForm(form2);
    if (err2) {
      setError(`👧 Girl: ${err2}`);
      return;
    }
    // ────────────────────────────────────────────
    setLoading(true);
    setError("");
    try {
      const createDate = (f: BirthData) =>
        new Date(
          Number(f.year),
          Number(f.month) - 1,
          Number(f.day),
          Number(f.hour),
          Number(f.minute),
          0,
        );
      const date1 = createDate(form);
      const date2 = createDate(form2);
      if (isNaN(date1.getTime()) || isNaN(date2.getTime()))
        throw new Error("Invalid date/time in one of the charts");
      const obs1 = new Observer(Number(form.lat), Number(form.lng), 200);
      const obs2 = new Observer(Number(form2.lat), Number(form2.lng), 200);
      const data1 = getPanchangam(date1, obs1, { timezoneOffset: TZ_OFFSET });
      const data2 = getPanchangam(date2, obs2, { timezoneOffset: TZ_OFFSET });
      setKundliData(data1);
      setKundliData2(data2);
      setShowForm(false);
    } catch (e: any) {
      setError(e.message ?? "Matching calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const lagnaRashi =
    kundliData?.lagna ?? kundliData?.planetaryPositions?.sun?.rashi ?? 0;
  const planets: Record<string, number> = {};
  if (kundliData?.planetaryPositions) {
    Object.entries(kundliData.planetaryPositions).forEach(([k, v]: any) => {
      planets[k] = v.rashi ?? 0;
    });
  }

  const moonNak1 = kundliData?.nakshatra ?? 0;
  const moonNak2 = kundliData2?.nakshatra ?? 0;
  const gunScore = kundliData2
    ? computeGunMilanAdvanced(
        kundliData.planetaryPositions?.moon?.rashi ?? 0,
        kundliData2.planetaryPositions?.moon?.rashi ?? 0,
        moonNak1,
        moonNak2,
      )
    : null;

  const handleResetMatching = (type: number) => {
    if (type === 1) {
      setForm({
        name: "",
        day: "",
        month: "",
        year: "",
        hour: "",
        minute: "",
        place: "",
        lat: "",
        lng: "",
      });
      setKundliData(null);
    } else {
      setKundliData2(null);
      setForm2({
        name: "",
        day: "",
        month: "",
        year: "",
        hour: "",
        minute: "",
        place: "",
        lat: "",
        lng: "",
      });
    }
    setError("");
  };

  return (
    <GradientBackground>
      <View style={st.tabRow}>
        <TouchableOpacity
          style={[st.tab, tab === "kundli" && st.tabActive]}
          onPress={() => setTab("kundli")}
          activeOpacity={0.7}
        >
          <Text style={[st.tabTxt, tab === "kundli" && st.tabTxtActive]}>
            🔮 कुंडली · Kundli
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tab, tab === "matching" && st.tabActive]}
          onPress={() => setTab("matching")}
          activeOpacity={0.7}
        >
          <Text style={[st.tabTxt, tab === "matching" && st.tabTxtActive]}>
            💑 गुण मिलान · Matching
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={st.container}
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === "kundli" && (
          <>
            {showForm ? (
              <BirthForm
                form={form}
                setForm={setForm}
                onGenerate={handleGenerate}
                loading={loading}
                title="जन्म विवरण · Birth Details"
              />
            ) : (
              <TouchableOpacity
                style={st.editBar}
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
              >
                <Text style={st.editBarTxt}>
                  ✏️ {form.name || "जातक"} — {form.day}/{form.month}/{form.year}{" "}
                  {form.hour}:{form.minute}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.gold} />
              </TouchableOpacity>
            )}

            {error ? <Text style={st.errorTxt}>⚠️ {error}</Text> : null}

            {kundliData && !showForm && (
              <>
                <SecDiv en="Birth Chart" hi="जन्म कुंडली" />
                <View style={st.chartWrap}>
                  <KundliChart planets={planets} lagna={lagnaRashi} />
                  <View style={st.lagnaLegend}>
                    <Text style={st.lagnaLegendTxt}>
                      लग्न (Lagna): {RASHI_HI[lagnaRashi]} ·{" "}
                      {RASHI_EN[lagnaRashi]} {RASHI_SYMBOL[lagnaRashi]}
                    </Text>
                  </View>
                </View>

                <SecDiv en="Planetary Positions" hi="ग्रह स्थिति" />
                {PLANET_KEY.map((key, i) => {
                  const pd = kundliData.planetaryPositions?.[key];
                  if (!pd) return null;
                  const rashi = pd.rashi ?? 0;
                  const deg = pd.degree?.toFixed(2) ?? "—";
                  const lon = pd.longitude?.toFixed(4) ?? "—";
                  return (
                    <InfoRow
                      key={key}
                      icon={PLANET_ICON[i]}
                      labelEn={PLANET_EN[i]}
                      labelHi={PLANET_HI[i]}
                      valueEn={`${RASHI_EN[rashi]}  ${deg}°`}
                      valueHi={`${RASHI_HI[rashi]} · ${lon}°`}
                    />
                  );
                })}

                <SecDiv en="Chart Summary" hi="राशि विवरण" />
                <InfoRow
                  icon="🌙"
                  labelEn="Moon Rashi (Chandra)"
                  labelHi="चन्द्र राशि"
                  valueEn={
                    RASHI_EN[kundliData.planetaryPositions?.moon?.rashi ?? 0]
                  }
                  valueHi={
                    RASHI_HI[kundliData.planetaryPositions?.moon?.rashi ?? 0]
                  }
                  accent
                />
                <InfoRow
                  icon="☀️"
                  labelEn="Sun Rashi"
                  labelHi="सूर्य राशि"
                  valueEn={
                    RASHI_EN[kundliData.planetaryPositions?.sun?.rashi ?? 0]
                  }
                  valueHi={
                    RASHI_HI[kundliData.planetaryPositions?.sun?.rashi ?? 0]
                  }
                />
                <InfoRow
                  icon="⭐"
                  labelEn="Janma Nakshatra"
                  labelHi="जन्म नक्षत्र"
                  valueEn={
                    nakshatraNames?.[kundliData.nakshatra] ??
                    String(kundliData.nakshatra)
                  }
                  valueHi={NAKSHATRA_HI[kundliData.nakshatra] ?? ""}
                />
                <InfoRow
                  icon="🌙"
                  labelEn="Tithi"
                  labelHi="तिथि"
                  valueEn={
                    tithiNames?.[kundliData.tithi] ?? String(kundliData.tithi)
                  }
                  valueHi={TITHI_HI[kundliData.tithi] ?? ""}
                />

                {kundliData.vimshottariDasha && (
                  <>
                    <SecDiv en="Vimshottari Dasha" hi="विम्शोत्तरी दशा" />
                    <TouchableOpacity
                      style={st.dashaHeader}
                      onPress={() => setExpandDasha((v) => !v)}
                      activeOpacity={0.8}
                    >
                      <View style={st.dashaMain}>
                        <Text style={st.dashaMainPlanet}>
                          🔮{" "}
                          {kundliData.vimshottariDasha.currentMahadasha
                            ?.planet ?? "—"}
                        </Text>
                        <Text style={st.dashaMainHi}>महादशा · Mahadasha</Text>
                        {kundliData.vimshottariDasha.dashaBalance && (
                          <Text style={st.dashaBalance}>
                            ⏳ {kundliData.vimshottariDasha.dashaBalance}{" "}
                            remaining
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={expandDasha ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.gold}
                      />
                    </TouchableOpacity>
                    {expandDasha && kundliData.vimshottariDasha.antardashas && (
                      <View style={st.antardashaBox}>
                        <Text style={st.antardashaTitle}>
                          अंतर्दशा · Antardashas
                        </Text>
                        {kundliData.vimshottariDasha.antardashas.map(
                          (ad: any, i: number) => (
                            <View key={i} style={st.antardashaRow}>
                              <View
                                style={[
                                  st.antardashaDot,
                                  {
                                    backgroundColor:
                                      DASHA_COLORS[i % DASHA_COLORS.length],
                                  },
                                ]}
                              />
                              <Text style={st.antardashaName}>{ad.planet}</Text>
                              <Text style={st.antardashaDate}>
                                {ad.startDate
                                  ? new Date(ad.startDate).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "2-digit",
                                      },
                                    )
                                  : ""}
                                {ad.endDate
                                  ? ` → ${new Date(ad.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}`
                                  : ""}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    )}
                  </>
                )}

                {kundliData.hora && (
                  <>
                    <SecDiv en="Planetary Hora at Birth" hi="जन्म होरा" />
                    <InfoRow
                      icon="⏱"
                      labelEn="Birth Hora Ruler"
                      labelHi="होरा स्वामी"
                      valueEn={kundliData.hora}
                      accent
                    />
                  </>
                )}

                {kundliData.specialYogas &&
                  kundliData.specialYogas.length > 0 && (
                    <>
                      <SecDiv en="Special Yogas" hi="विशेष योग" />
                      {kundliData.specialYogas.map(
                        (yoga: string, i: number) => (
                          <View key={i} style={st.yogaBadge}>
                            <Text style={st.yogaIcon}>✨</Text>
                            <Text style={st.yogaName}>{yoga}</Text>
                          </View>
                        ),
                      )}
                    </>
                  )}

                <TouchableOpacity
                  style={st.regenBtn}
                  onPress={() => setShowForm(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.gold}
                  />
                  <Text style={st.regenTxt}>नई कुंडली · New Chart</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {tab === "matching" && (
          <>
            <Text style={st.matchingHeader}>
              💑 गुण मिलान · Kundli Matching
            </Text>
            <Text style={st.matchingSubtitle}>
              Ashtakoota matching using Janma Nakshatra
            </Text>

            <View style={st.personCard}>
              <Text style={st.personLabel}>
                👨 लड़के का विवरण · Boy Details
              </Text>
              <BirthForm
                form={form}
                setForm={setForm}
                loading={loading}
                compact
                title=""
                noGenerate
              />
            </View>
            <View style={st.personCard}>
              <Text style={st.personLabel}>
                👧 लड़की का विवरण · Girl Details
              </Text>
              <BirthForm
                form={form2}
                setForm={setForm2}
                loading={loading}
                compact
                title=""
                noGenerate
              />
              <TouchableOpacity
                style={[st.generateBtn, { marginTop: spacing.md }]}
                onPress={handleMatching}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.bgSecondary} size="small" />
                ) : (
                  <Text style={st.generateBtnTxt}>
                    💑 गुण मिलान करें · Calculate Matching
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {error ? <Text style={st.errorTxt}>⚠️ {error}</Text> : null}

            {kundliData && kundliData2 && gunScore && (
              <>
                <SecDiv en="Ashtakoota Score" hi="अष्टकूट मिलान" />
                <View style={st.totalScoreBox}>
                  <Text style={st.totalScoreNum}>{gunScore.total}</Text>
                  <Text style={st.totalScoreOf}>/36</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <View style={st.scoreBar}>
                      <View
                        style={[
                          st.scoreBarFill,
                          {
                            width: `${(gunScore.total / 36) * 100}%` as any,
                            backgroundColor: scoreBg(gunScore.total),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        st.scoreVerdict,
                        { color: scoreBg(gunScore.total) },
                      ]}
                    >
                      {scoreVerdict(gunScore.total)}
                    </Text>
                  </View>
                </View>

                <SecDiv en="Koota Breakdown" hi="कूट विवरण" />
                {KOOTA_DATA.map((k, i) => {
                  const score = gunScore.kootas[i];
                  return (
                    <View style={st.kootamainRow} key={k.en}>
                      <View style={st.kootaRow}>
                        <View style={st.kootaLabels}>
                          <Text style={st.kootaHi}>{k.hi}</Text>
                          <Text style={st.kootaEn}>{k.en}</Text>
                        </View>
                        <View style={st.kootaBarWrap}>
                          <View style={st.kootaBarTrack}>
                            <View
                              style={[
                                st.kootaBarFill,
                                {
                                  width: `${(score / k.max) * 100}%` as any,
                                  backgroundColor:
                                    score === k.max
                                      ? "#22C55E"
                                      : score > 0
                                        ? colors.gold
                                        : "#EF4444",
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={st.kootaScore}>
                          {score}/{k.max}
                        </Text>
                      </View>
                      {k.en === "Nadi" && (
                        <Text style={{ color: "#EF4444", fontSize: 10 }}>
                          <Text style={{ color: colors.textMuted }}>
                            {" "}
                            Boy:{" "}
                          </Text>
                          {gunScore.details.boyNadi}{" "}
                          <Text style={st.kootaHi}>vs</Text>
                          <Text style={{ color: colors.textMuted }}>
                            {" "}
                            Girl:{" "}
                          </Text>
                          {gunScore.details.girlNadi}
                        </Text>
                      )}
                      {k.en === "Bhakoot" && (
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>
                          Position: {gunScore.details.bhakootDistance}-axis
                        </Text>
                      )}
                    </View>
                  );
                })}

                <SecDiv en="Mangal Dosha" hi="मंगल दोष" />
                <View style={st.doshaBox}>
                  <MangalDosha data={kundliData} label="Person 1" />
                  <View style={st.doshaDivider} />
                  <MangalDosha data={kundliData2} label="Person 2" />
                </View>
              </>
            )}
          </>
        )}
        {kundliData && kundliData2 && gunScore && tab === "matching" && (
          <TouchableOpacity
            style={st.regenBtn}
            onPress={() => handleResetMatching(2)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={colors.gold} />
            <Text style={st.regenTxt}>नई कुंडली मिलान · New Kundli Match</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

// ─────────────────────────────────────────────
// BIRTH FORM COMPONENT
// ─────────────────────────────────────────────
const BirthForm = ({
  form,
  setForm,
  onGenerate,
  loading,
  title,
  compact,
  noGenerate,
}: {
  form: BirthData;
  setForm: React.Dispatch<React.SetStateAction<BirthData>>;
  onGenerate?: () => void;
  loading: boolean;
  title: string;
  compact?: boolean;
  noGenerate?: boolean;
}) => {
  const f = (key: keyof BirthData, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {title ? <Text style={st.formTitle}>{title}</Text> : null}
      <View style={[st.formCard, compact && st.formCardCompact]}>
        {!compact && (
          <View style={st.formRow}>
            <Text style={st.formLabel}>नाम · Name</Text>
            <TextInput
              style={st.input}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(v) => f("name", v)}
            />
          </View>
        )}
        <View style={st.formRow}>
          <Text style={st.formLabel}>
            जन्म तिथि · Birth Date <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <View style={st.formTriple}>
            <TextInput
              style={[st.input, st.inputSm]}
              placeholder="DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={form.day}
              onChangeText={(v) => f("day", v)}
            />
            <TextInput
              style={[st.input, st.inputSm]}
              placeholder="MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={form.month}
              onChangeText={(v) => f("month", v)}
            />
            <TextInput
              style={[st.input, st.inputMd]}
              placeholder="YYYY"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              value={form.year}
              onChangeText={(v) => f("year", v)}
            />
          </View>
        </View>
        <View style={st.formRow}>
          <Text style={st.formLabel}>
            जन्म समय · Birth Time <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <View style={st.formDouble}>
            <TextInput
              style={[st.input, st.inputSm]}
              placeholder="HH (24h)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={form.hour}
              onChangeText={(v) => f("hour", v)}
            />
            <TextInput
              style={[st.input, st.inputSm]}
              placeholder="MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={form.minute}
              onChangeText={(v) => f("minute", v)}
            />
          </View>
        </View>
        <View style={st.formRow}>
          <Text style={st.formLabel}>
            स्थान · Location <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <GooglePlacesAutocomplete
            placeholder="Enter city (min 3 chars)"
            minLength={3}
            fetchDetails={true}
            onPress={(data, details = null) => {
              const lat = details?.geometry.location.lat;
              const lng = details?.geometry.location.lng;
              setForm((p) => ({
                ...p,
                place: data.description,
                lat: String(lat),
                lng: String(lng),
              }));
            }}
            query={{
              key: "AIzaSyBOSKUAAlSxejC94KZURRcCaZR3IMp2PLU",
              language: "en",
              types: "(cities)",
            }}
            styles={{
              textInput: {
                backgroundColor: colors.bgSecondary,
                color: colors.textPrimary,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                paddingHorizontal: 10,
              },
              listView: {
                backgroundColor: colors.cardBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              },
            }}
          />
          {form.place ? (
            <Text style={{ fontSize: 11, color: colors.gold, marginTop: 4 }}>
              📍 {form.place}
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
              स्थान चुनना अनिवार्य है · Location is required
            </Text>
          )}
        </View>
        {!noGenerate && (
          <TouchableOpacity
            style={st.generateBtn}
            onPress={onGenerate}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.bgSecondary} size="small" />
            ) : (
              <Text style={st.generateBtnTxt}>
                कुंडली बनाएं · Generate Kundli
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────
// MANGAL DOSHA
// ─────────────────────────────────────────────
const MangalDosha = ({ data, label }: { data: any; label: string }) => {
  if (!data) return null;
  const marsRashi = data.planetaryPositions?.mars?.rashi ?? -1;
  const lagna = data.lagna ?? data.planetaryPositions?.sun?.rashi ?? 0;
  const marsHouse = ((marsRashi - lagna + 12) % 12) + 1;
  const hasDosha = [1, 4, 7, 8, 12].includes(marsHouse);
  return (
    <View style={st.doshaItem}>
      <Text style={st.doshaLabel}>{label}</Text>
      <Text
        style={[st.doshaResult, { color: hasDosha ? "#EF4444" : "#22C55E" }]}
      >
        {hasDosha ? "⚠️ मांगलिक है" : "✅ मांगलिक नहीं"}
      </Text>
      <Text style={st.doshaSub}>Mars in house {marsHouse}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// GUN MILAN CALCULATOR
// ─────────────────────────────────────────────
function computeGunMilanAdvanced(
  boyMoonRashi: number,
  girlMoonRashi: number,
  boyNak: number,
  girlNak: number,
) {
  const kootas = new Array(8).fill(0);
  const boyVarna = VARNA_BY_RASHI[boyMoonRashi];
  const girlVarna = VARNA_BY_RASHI[girlMoonRashi];
  kootas[0] = boyVarna === girlVarna ? 1 : 0;
  const rashiDiff = (girlMoonRashi - boyMoonRashi + 12) % 12;
  kootas[1] = rashiDiff <= 6 ? 2 : 1;
  const taraDiff = Math.abs(boyNak - girlNak) % 9;
  kootas[2] = taraDiff < 3 ? 3 : taraDiff < 6 ? 1 : 0;
  kootas[3] = boyNak % 3 === girlNak % 3 ? 4 : 2;
  kootas[4] = rashiDiff <= 4 ? 5 : 2;
  const boyGana = GANA_BY_NAKSHATRA[boyNak];
  const girlGana = GANA_BY_NAKSHATRA[girlNak];
  kootas[5] = boyGana === girlGana ? 6 : 3;
  const bhakootDistance = rashiDiff;
  kootas[6] = [2, 6, 8, 12].includes(bhakootDistance) ? 0 : 7;
  const boyNadi = NADI_BY_NAKSHATRA[boyNak];
  const girlNadi = NADI_BY_NAKSHATRA[girlNak];
  kootas[7] = boyNadi === girlNadi ? 0 : 8;
  const total = kootas.reduce((a, b) => a + b, 0);
  return {
    kootas,
    total,
    details: {
      boyVarna,
      girlVarna,
      boyGana,
      girlGana,
      boyNadi,
      girlNadi,
      bhakootDistance,
    },
  };
}

function scoreBg(score: number): string {
  if (score >= 27) return "#22C55E";
  if (score >= 18) return "#FBBF24";
  return "#EF4444";
}
function scoreVerdict(score: number) {
  if (score >= 28) return "Excellent Match · उत्तम मेल";
  if (score >= 21) return "Good Match · अच्छा मेल";
  if (score >= 18) return "Average Match · औसत मेल";
  return "Low Compatibility · कम अनुकूलता";
}

const DASHA_COLORS = [
  "#F4D160",
  "#60A5FA",
  "#F472B6",
  "#86EFAC",
  "#FB923C",
  "#818CF8",
  "#FBBF24",
  "#34D399",
  "#EF4444",
];
const TITHI_HI = [
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पञ्चमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "पूर्णिमा",
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पञ्चमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "अमावस्या",
];

// ─────────────────────────────────────────────
// STYLES  (unchanged from original)
// ─────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.cardBg + "60",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabActive: { backgroundColor: colors.gold + "20", borderColor: colors.gold },
  tabTxt: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  tabTxtActive: { color: colors.gold },
  formTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.gold,
    fontWeight: "bold",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formCardCompact: { padding: spacing.sm, gap: spacing.xs },
  formRow: { gap: spacing.xs },
  formLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formTriple: { flexDirection: "row", gap: spacing.sm },
  formDouble: { flexDirection: "row", gap: spacing.sm },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  inputSm: { flex: 0, width: 52 },
  inputMd: { flex: 0, width: 72 },
  generateBtn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  generateBtnTxt: {
    color: colors.bgSecondary,
    fontWeight: "bold",
    fontSize: typography.fontSize.md,
  },
  editBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.gold + "10",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold + "30",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },
  editBarTxt: { fontSize: 12, color: colors.gold, fontWeight: "600", flex: 1 },
  errorTxt: {
    color: "#EF4444",
    textAlign: "center",
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  chartWrap: { marginVertical: spacing.sm },
  kundliGrid: {
    borderWidth: 1.5,
    borderColor: colors.gold + "50",
    borderRadius: 4,
    overflow: "hidden",
  },
  kundliRow: { flexDirection: "row" },
  kundliCell: {
    borderWidth: 0.5,
    borderColor: colors.gold + "30",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  lagnaCell: {
    backgroundColor: colors.gold + "15",
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  kundliCenterCell: {
    borderWidth: 0.5,
    borderColor: colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBg + "40",
  },
  kundliCenter: { fontSize: 14, color: colors.gold, fontWeight: "bold" },
  kundliCenterEn: { fontSize: 10, color: colors.textMuted },
  houseNum: {
    fontSize: 8,
    color: colors.textMuted,
    position: "absolute",
    top: 2,
    left: 4,
  },
  rashiSymbol: { fontSize: 14, color: colors.gold },
  rashiShort: { fontSize: 7, color: colors.gold + "CC", fontWeight: "600" },
  planetIcons: { fontSize: 8, flexWrap: "wrap", textAlign: "center" },
  lagnaLegend: {
    marginTop: spacing.xs,
    backgroundColor: colors.gold + "10",
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
  },
  lagnaLegendTxt: { fontSize: 12, color: colors.gold, fontWeight: "600" },
  secDiv: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  secLine: { flex: 1, height: 1, backgroundColor: colors.gold + "30" },
  secPill: {
    flexDirection: "row",
    backgroundColor: colors.gold + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginHorizontal: 8,
  },
  secHi: { fontSize: 11, color: colors.gold, fontWeight: "600" },
  secEn: { fontSize: 11, color: colors.textMuted },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "40",
    gap: 8,
  },
  infoIcon: { fontSize: 15, width: 22, textAlign: "center" },
  infoLabels: { width: 110 },
  infoLabelHi: { fontSize: 11, color: colors.gold + "CC" },
  infoLabelEn: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValues: { flex: 1, alignItems: "flex-end" },
  infoValueEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: "500",
    textAlign: "right",
  },
  infoValueHi: {
    fontSize: 11,
    color: colors.gold,
    marginTop: 2,
    textAlign: "right",
  },
  accent: { color: colors.gold },
  dashaHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold + "40",
    padding: spacing.md,
    gap: spacing.sm,
  },
  dashaMain: { flex: 1 },
  dashaMainPlanet: {
    fontSize: typography.fontSize.xl,
    color: colors.gold,
    fontWeight: "bold",
  },
  dashaMainHi: { fontSize: 11, color: colors.textMuted },
  dashaBalance: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  antardashaBox: {
    backgroundColor: colors.cardBg + "60",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  antardashaTitle: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  antardashaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: spacing.sm,
  },
  antardashaDot: { width: 8, height: 8, borderRadius: 4 },
  antardashaName: {
    width: 80,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  antardashaDate: { flex: 1, fontSize: 11, color: colors.textMuted },
  yogaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "40",
  },
  yogaIcon: { fontSize: 16 },
  yogaName: {
    fontSize: typography.fontSize.sm,
    color: colors.gold,
    fontWeight: "600",
  },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg + "60",
  },
  regenTxt: { fontSize: typography.fontSize.sm, color: colors.textMuted },
  matchingHeader: {
    fontSize: typography.fontSize.xl,
    color: colors.gold,
    fontWeight: "bold",
    marginTop: spacing.lg,
    textAlign: "center",
  },
  matchingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  personCard: {
    backgroundColor: colors.cardBg + "60",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  personLabel: {
    fontSize: typography.fontSize.md,
    color: colors.gold,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  totalScoreBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  totalScoreNum: { fontSize: 52, fontWeight: "bold", color: colors.gold },
  totalScoreOf: {
    fontSize: 22,
    color: colors.textMuted,
    alignSelf: "flex-end",
    marginBottom: 6,
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreVerdict: { fontSize: typography.fontSize.sm, fontWeight: "bold" },
  kootaRow: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  kootamainRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider + "40",
    paddingVertical: 6,
  },
  kootaLabels: { width: 90 },
  kootaHi: { fontSize: 11, color: colors.gold + "CC", fontWeight: "600" },
  kootaEn: { fontSize: 10, color: colors.textMuted },
  kootaBarWrap: { flex: 1 },
  kootaBarTrack: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: "hidden",
  },
  kootaBarFill: { height: "100%", borderRadius: 3 },
  kootaScore: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: "600",
    width: 36,
    textAlign: "right",
  },
  doshaBox: {
    flexDirection: "row",
    backgroundColor: colors.cardBg + "60",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  doshaItem: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  doshaDivider: { width: 1, backgroundColor: colors.divider },
  doshaLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  doshaResult: {
    fontSize: typography.fontSize.md,
    fontWeight: "bold",
    textAlign: "center",
  },
  doshaSub: { fontSize: 10, color: colors.textMuted },
});
