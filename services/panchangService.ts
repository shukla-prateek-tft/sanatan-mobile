/**
 * panchangService.ts
 *
 * LOCATION — no more hardcoded coordinates.
 *  1. First launch  → requests GPS via expo-location
 *  2. GPS granted   → uses device coords + reverse geocodes city name
 *  3. GPS denied    → falls back to manual city search (Nominatim, free, no key)
 *  4. Location saved to AsyncStorage → reused instantly on next launch
 *  5. User can change location any time via `clearLocation()` or `setUserLocation()`
 *
 * SELF-CONTAINED — zero external constant imports.
 *
 * Dependencies:
 *   expo install expo-location
 *   npx expo install @react-native-async-storage/async-storage
 *   npm install mhah-panchang suncalc
 *   npm install --save-dev @types/suncalc
 */

import { MhahPanchang } from "mhah-panchang";
import SunCalc from "suncalc";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  timezone: string;
}

export type LocationStatus =
  | "idle" // not yet tried
  | "detecting" // GPS in progress
  | "detected" // success (GPS or manual)
  | "denied" // GPS denied, needs manual pick
  | "error"; // unexpected error

export interface LocationState {
  location: UserLocation | null;
  status: LocationStatus;
  error: string | null;
}

export interface CityResult {
  name: string;
  display: string;
  latitude: number;
  longitude: number;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const LOCATION_KEY = "panchang_user_location";

// Used only when absolutely everything fails
const FALLBACK_LOCATION: UserLocation = {
  latitude: 23.2599,
  longitude: 77.4126,
  city: "Bhopal",
  timezone: "Asia/Kolkata",
};

// In-memory cache so build() can run synchronously
let _loc: UserLocation = FALLBACK_LOCATION;
let _locReady = false;

// ─────────────────────────────────────────────
// TIMEZONE  — approximate from coordinates
// ─────────────────────────────────────────────
function tzFromCoords(lat: number, lng: number): string {
  if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) return "Asia/Kolkata";
  if (lat >= 26 && lat <= 30 && lng >= 80 && lng <= 88) return "Asia/Kathmandu";
  if (lat >= 6 && lat <= 10 && lng >= 79 && lng <= 82) return "Asia/Colombo";
  if (lat >= 20 && lat <= 27 && lng >= 88 && lng <= 93) return "Asia/Dhaka";
  if (lat >= 23 && lat <= 37 && lng >= 60 && lng <= 78) return "Asia/Karachi";
  if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154)
    return "Australia/Sydney";
  if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) return "Europe/London";
  if (lat >= 35 && lat <= 72 && lng >= 2 && lng <= 32) return "Europe/Paris";
  if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65)
    return "America/New_York";
  // Generic offset from longitude
  const h = Math.round(lng / 15);
  if (h === 0) return "UTC";
  return h > 0 ? `Etc/GMT-${h}` : `Etc/GMT+${Math.abs(h)}`;
}

// ─────────────────────────────────────────────
// REVERSE GEOCODING  (coords → city name)
// Nominatim only — expo-location.reverseGeocodeAsync removed in SDK 49
// ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { "User-Agent": "PanchangApp/1.0" } },
    );
    if (res.ok) {
      const data = await res.json();
      const a = data?.address ?? {};
      return a.city ?? a.town ?? a.village ?? a.county ?? "Unknown";
    }
  } catch {}
  return "Unknown";
}

// ─────────────────────────────────────────────
// FORWARD GEOCODING  (city name → results list)
// ─────────────────────────────────────────────
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      { headers: { "User-Agent": "PanchangApp/1.0" } },
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((r) => ({
      name:
        r.address?.city ??
        r.address?.town ??
        r.address?.village ??
        r.display_name.split(",")[0].trim(),
      display: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────
async function loadSaved(): Promise<UserLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (raw) return JSON.parse(raw) as UserLocation;
  } catch {}
  return null;
}

async function persist(loc: UserLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

// ─────────────────────────────────────────────
// GPS DETECTION
// ─────────────────────────────────────────────
async function detectFromGPS(): Promise<UserLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("PERMISSION_DENIED");

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const city = await reverseGeocode(lat, lng);
  const timezone = tzFromCoords(lat, lng);
  return { latitude: lat, longitude: lng, city, timezone };
}

// ─────────────────────────────────────────────
// PUBLIC LOCATION API
// ─────────────────────────────────────────────

/**
 * Call once at app start (e.g. in App.tsx or a root useEffect).
 * Returns the location to use. If GPS denied and nothing saved,
 * returns FALLBACK — the hook will show the manual picker.
 */
export async function initLocation(): Promise<UserLocation> {
  if (_locReady) return _loc;

  const saved = await loadSaved();
  if (saved) {
    _loc = saved;
    _locReady = true;
    return saved;
  }

  try {
    const gps = await detectFromGPS();
    await persist(gps);
    _loc = gps;
    _locReady = true;

    return gps;
  } catch {
    // GPS denied — leave _loc as fallback; hook will ask user to pick manually
    _locReady = true;
    return _loc;
  }
}

/** Activate a location chosen by the user and persist it. */
export async function setUserLocation(loc: UserLocation): Promise<void> {
  await persist(loc);
  _loc = loc;
  _locReady = true;
}

/** Build a UserLocation from a CityResult (from manual search). */
export async function locationFromCity(r: CityResult): Promise<UserLocation> {
  return {
    latitude: r.latitude,
    longitude: r.longitude,
    city: r.name,
    timezone: tzFromCoords(r.latitude, r.longitude),
  };
}

/** Clear saved location — next initLocation() will show picker again. */
export async function clearLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_KEY);
  } catch {}
  _loc = FALLBACK_LOCATION;
  _locReady = false;
}

/** Synchronous getter — returns current in-memory location. */
export function getCurrentLocation(): UserLocation {
  return _loc;
}

// ─────────────────────────────────────────────
// REACT HOOK  — usePanchangLocation
//
// Manages the full flow inside a component:
//   loading → GPS auto-detect → (if denied) show manual city search → done
//
// Usage:
//   const {
//     location, status, error,
//     detectGPS, pickCity, changeLocation,
//   } = usePanchangLocation();
//
//   if (status === 'idle' || status === 'detecting') return <Spinner />;
//   if (status === 'denied') return <CityPicker onPick={pickCity} />;
//   return <YourScreen />;
// ─────────────────────────────────────────────
export function usePanchangLocation() {
  const [state, setState] = useState<LocationState>({
    location: _locReady ? _loc : null,
    status: _locReady ? "detected" : "idle",
    error: null,
  });

  useEffect(() => {
    if (_locReady) {
      setState({ location: _loc, status: "detected", error: null });
      return;
    }
    setState((s) => ({ ...s, status: "detecting" }));

    initLocation().then((loc) => {
      console.log("====================================");
      console.log(loc);
      console.log("====================================");
      // If initLocation returned FALLBACK with no saved location → denied
      const wasDenied = loc === FALLBACK_LOCATION;
      setState({
        location: loc,
        status: wasDenied ? "denied" : "detected",
        error: null,
      });
    });
  }, []);

  const detectGPS = useCallback(async () => {
    setState((s) => ({ ...s, status: "detecting", error: null }));
    try {
      const loc = await detectFromGPS();
      await setUserLocation(loc);
      setState({ location: loc, status: "detected", error: null });
    } catch (e: any) {
      const msg =
        e.message === "PERMISSION_DENIED"
          ? "GPS permission denied. Please search for your city below."
          : "Could not detect location. Please search manually.";
      setState((s) => ({ ...s, status: "denied", error: msg }));
    }
  }, []);

  const pickCity = useCallback(async (city: CityResult) => {
    const loc = await locationFromCity(city);
    await setUserLocation(loc);
    setState({ location: loc, status: "detected", error: null });
  }, []);

  const changeLocation = useCallback(async () => {
    await clearLocation();
    setState({ location: null, status: "denied", error: null });
  }, []);

  return { ...state, detectGPS, pickCity, changeLocation };
}

// ─────────────────────────────────────────────
// LOOKUP ARRAYS
// ─────────────────────────────────────────────
const TITHI_EN = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya",
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
const NAKSHATRA_EN = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];
const NAKSHATRA_HI = [
  "अश्विनी",
  "भरणी",
  "कृत्तिका",
  "रोहिणी",
  "मृगशिरा",
  "आर्द्रा",
  "पुनर्वसु",
  "पुष्य",
  "आश्लेषा",
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
  "पूर्वाषाढ़ा",
  "उत्तराषाढ़ा",
  "श्रवण",
  "धनिष्ठा",
  "शतभिषा",
  "पूर्व भाद्रपदा",
  "उत्तर भाद्रपदा",
  "रेवती",
];
const YOGA_EN = [
  "Vishkumbha",
  "Preeti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarman",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];
const YOGA_HI = [
  "विष्कुम्भ",
  "प्रीति",
  "आयुष्मान",
  "सौभाग्य",
  "शोभन",
  "अतिगण्ड",
  "सुकर्मा",
  "धृति",
  "शूल",
  "गण्ड",
  "वृद्धि",
  "ध्रुव",
  "व्याघात",
  "हर्षण",
  "वज्र",
  "सिद्धि",
  "व्यतीपात",
  "वरीयान",
  "परिघ",
  "शिव",
  "सिद्ध",
  "साध्य",
  "शुभ",
  "शुक्ल",
  "ब्रह्म",
  "ऐन्द्र",
  "वैधृति",
];
const KARANA_EN = [
  "Kimstughna",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Garaja",
  "Vanija",
  "Vishti",
  "Shakuni",
  "Chatushpada",
  "Naga",
];
const KARANA_HI = [
  "किंस्तुघ्न",
  "बव",
  "बालव",
  "कौलव",
  "तैतिल",
  "गरज",
  "वणिज",
  "विष्टि",
  "शकुनि",
  "चतुष्पाद",
  "नाग",
];
const MASA_EN = [
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwin",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
];
const MASA_HI = [
  "चैत्र",
  "वैशाख",
  "ज्येष्ठ",
  "आषाढ़",
  "श्रावण",
  "भाद्रपद",
  "आश्विन",
  "कार्तिक",
  "मार्गशीर्ष",
  "पौष",
  "माघ",
  "फाल्गुन",
];
const RITU_EN = [
  "Vasanta",
  "Grishma",
  "Varsha",
  "Sharad",
  "Hemanta",
  "Shishira",
];
const RITU_HI = ["वसन्त", "ग्रीष्म", "वर्षा", "शरद", "हेमन्त", "शिशिर"];
const RAASI_EN = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrishchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];
const RAASI_HI = [
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
const VARA_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const VARA_HI = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
];

function lk(arr: string[], i: number, fb?: string): string {
  return i >= 0 && i < arr.length ? arr[i] : (fb ?? "Unknown");
}

// ─────────────────────────────────────────────
// EXPORTED LABEL CONSTANTS
// ─────────────────────────────────────────────
export const FIELD_LABELS_HI = {
  tithi: "तिथि",
  nakshatra: "नक्षत्र",
  yoga: "योग",
  karana: "करण",
  vara: "वार",
  masa: "मास",
  ritu: "ऋतु",
  raasi: "राशि",
  sunrise: "सूर्योदय",
  sunset: "सूर्यास्त",
  moonrise: "चन्द्रोदय",
  moonset: "चन्द्रास्त",
  solarNoon: "मध्याह्न",
  brahmaHora: "ब्रह्म मुहूर्त",
  paksha: "पक्ष",
  ayanamsa: "अयनांश",
  vikramSamvat: "विक्रम संवत्",
  shakaSamvat: "शक संवत्",
  moonPhase: "चन्द्र कला",
  waxing: "शुक्ल (बढ़ता)",
  waning: "कृष्ण (घटता)",
};
export const SECTION_LABELS_HI = {
  panchang: "पञ्चाङ्ग",
  calendar: "हिन्दू पंचांग",
  sunMoon: "सूर्य एवं चन्द्र",
  auspicious: "शुभ मुहूर्त",
  inauspicious: "अशुभ काल",
  astronomy: "खगोलीय जानकारी",
  mantra: "आज का मंत्र",
};
export const MUHURTA_LABELS_HI = {
  abhijit: "अभिजित् मुहूर्त",
  amritKaal: "अमृत काल",
  brahma: "ब्रह्म मुहूर्त",
  rahuKaal: "राहु काल",
  yamagandam: "यमगण्डम्",
  gulikai: "गुलिकाई / मांडी",
  durmuhurta: "दुर्मुहूर्त",
  varjyam: "वर्ज्यम्",
};

// ─────────────────────────────────────────────
// PANCHANG DATA TYPE
// ─────────────────────────────────────────────
export interface TimeSlot {
  start: string;
  end: string;
}
export interface PanchangData {
  tithi: string;
  tithi_hi: string;
  tithiEnd: string;
  nakshatra: string;
  nakshatra_hi: string;
  nakshatraEnd: string;
  yoga: string;
  yoga_hi: string;
  yogaEnd: string;
  karana: string;
  karana_hi: string;
  karanaEnd: string;
  vara: string;
  vara_hi: string;
  moonPhase: number;
  paksha: "Shukla" | "Krishna";
  paksha_hi: string;
  raasi: string;
  raasi_hi: string;
  masa: string;
  masa_hi: string;
  ritu: string;
  ritu_hi: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  solarNoon: string;
  brahmaHora: string;
  rahuKaal: TimeSlot;
  yamagandam: TimeSlot;
  gulikai: TimeSlot;
  durmuhurta: TimeSlot;
  varjyam: TimeSlot;
  abhijitMuhurta: TimeSlot;
  amritKaal: TimeSlot;
  vikramSamvat: string;
  shakaSamvat: string;
  ayanamsa: string;
  tithiIno: number;
  date: string;
  date_hi: string;
  locationCity: string; // NEW — which city was used
}

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────
const mhah = new MhahPanchang();

function fmt(d: Date | null | undefined, tz: string): string {
  if (!d || isNaN(d.getTime())) return "N/A";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}
function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}
function subMin(d: Date, m: number) {
  return new Date(d.getTime() - m * 60_000);
}

function slot(rise: Date, set: Date, idx: number, tz: string): TimeSlot {
  const unit = (set.getTime() - rise.getTime()) / 8;
  const s = new Date(rise.getTime() + unit * idx);
  return { start: fmt(s, tz), end: fmt(new Date(s.getTime() + unit), tz) };
}
function rahuKaal(r: Date, s: Date, d: number, tz: string) {
  return slot(r, s, [7, 1, 6, 4, 5, 3, 2][d], tz);
}
function yamagandam(r: Date, s: Date, d: number, tz: string) {
  return slot(r, s, [4, 3, 2, 1, 0, 6, 5][d], tz);
}
function gulikai(r: Date, s: Date, d: number, tz: string) {
  return slot(r, s, [5, 4, 3, 2, 1, 0, 6][d], tz);
}
function abhijit(r: Date, s: Date, tz: string): TimeSlot {
  const n = new Date((r.getTime() + s.getTime()) / 2);
  return { start: fmt(subMin(n, 24), tz), end: fmt(addMin(n, 24), tz) };
}
function durmuhurta(r: Date, d: number, tz: string): TimeSlot {
  const s = addMin(r, [270, 90, 450, 630, 150, 510, 330][d]);
  return { start: fmt(s, tz), end: fmt(addMin(s, 48), tz) };
}
function varjyam(r: Date, d: number, tz: string): TimeSlot {
  const s = addMin(r, [480, 390, 300, 420, 360, 450, 510][d]);
  return { start: fmt(s, tz), end: fmt(addMin(s, 90), tz) };
}
function amritKaal(r: Date, d: number, tz: string): TimeSlot {
  const s = addMin(r, [120, 60, 180, 90, 150, 30, 210][d]);
  return { start: fmt(s, tz), end: fmt(addMin(s, 90), tz) };
}
function parseAyanamsa(calc: any): string {
  const raw = calc?.Ayanamsa ?? calc?.ayanamsa ?? calc?.ayanamsha;
  if (raw == null) return "N/A";
  const val =
    typeof raw === "object"
      ? (raw?.value ?? raw?.ino ?? raw?.name ?? raw)
      : raw;
  const num = parseFloat(String(val));
  return isNaN(num) ? String(raw) : `${num.toFixed(4)}°`;
}

// ─────────────────────────────────────────────
// CORE BUILDER — reads _loc (dynamic, not hardcoded)
// ─────────────────────────────────────────────
function build(date: Date): PanchangData {
  const { latitude: LAT, longitude: LNG, timezone: TZ, city } = _loc;

  // Normalize to noon local time — prevents UTC day-shift bug in IST and others
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  );

  let calc: any = {};
  let sun: any = {};
  try {
    calc = mhah.calculate(d) ?? {};
  } catch (e) {
    console.warn("mhah.calculate:", e);
  }
  try {
    sun = mhah.sunTimer(d, LAT, LNG) ?? {};
  } catch (e) {
    console.warn("mhah.sunTimer:", e);
  }

  const tithiIno = Number(calc?.Tithi?.ino ?? 0);
  const nakshatraIno = Number(calc?.Nakshatra?.ino ?? 0);
  const yogaIno = Number(calc?.Yoga?.ino ?? 0);
  const karanaIno = Number(calc?.Karna?.ino ?? 0);
  const masaIno = Number(calc?.Masa?.ino ?? 0);
  const raasiIno = Number(calc?.Raasi?.ino ?? 0);
  const rituIno = Math.floor(masaIno / 2) % 6;
  const dayIno = d.getDay();

  const tithiEn = String(calc?.Tithi?.name_en_IN || lk(TITHI_EN, tithiIno));
  const nakshatraEn = String(
    calc?.Nakshatra?.name_en_IN || lk(NAKSHATRA_EN, nakshatraIno),
  );
  const yogaEn = String(calc?.Yoga?.name_en_IN || lk(YOGA_EN, yogaIno));
  const karanaEn = String(calc?.Karna?.name_en_IN || lk(KARANA_EN, karanaIno));
  const masaEn = String(calc?.Masa?.name_en_IN || lk(MASA_EN, masaIno));
  const raasiEn = String(calc?.Raasi?.name_en_IN || lk(RAASI_EN, raasiIno));
  const rituEn = String(calc?.Ritu?.name_en_IN || lk(RITU_EN, rituIno));
  const varaEn = lk(VARA_EN, dayIno);

  const tithiHi = lk(TITHI_HI, tithiIno, tithiEn);
  const nakshatraHi = lk(NAKSHATRA_HI, nakshatraIno, nakshatraEn);
  const yogaHi = lk(YOGA_HI, yogaIno, yogaEn);
  const karanaHi = lk(KARANA_HI, karanaIno, karanaEn);
  const masaHi = lk(MASA_HI, masaIno, masaEn);
  const raasiHi = lk(RAASI_HI, raasiIno, raasiEn);
  const rituHi = lk(RITU_HI, rituIno, rituEn);
  const varaHi = lk(VARA_HI, dayIno);

  const paksha: "Shukla" | "Krishna" = tithiIno <= 14 ? "Shukla" : "Krishna";
  const paksha_hi = paksha === "Shukla" ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  const sunRise: Date = sun?.sunRise instanceof Date ? sun.sunRise : new Date();
  const sunSet: Date =
    sun?.sunSet instanceof Date ? sun.sunSet : addMin(sunRise, 720);
  const noon = new Date((sunRise.getTime() + sunSet.getTime()) / 2);

  const moonTimes = SunCalc.getMoonTimes(d, LAT, LNG);
  const moonIllum = SunCalc.getMoonIllumination(d);

  return {
    tithi: tithiEn,
    tithi_hi: tithiHi,
    tithiEnd: fmt(calc?.Tithi?.end, TZ),
    nakshatra: nakshatraEn,
    nakshatra_hi: nakshatraHi,
    nakshatraEnd: fmt(calc?.Nakshatra?.end, TZ),
    yoga: yogaEn,
    yoga_hi: yogaHi,
    yogaEnd: fmt(calc?.Yoga?.end, TZ),
    karana: karanaEn,
    karana_hi: karanaHi,
    karanaEnd: fmt(calc?.Karna?.end, TZ),
    vara: varaEn,
    vara_hi: varaHi,
    moonPhase: moonIllum.phase,
    paksha,
    paksha_hi,
    raasi: raasiEn,
    raasi_hi: raasiHi,
    masa: masaEn,
    masa_hi: masaHi,
    ritu: rituEn,
    ritu_hi: rituHi,
    sunrise: fmt(sun?.sunRise, TZ),
    sunset: fmt(sun?.sunSet, TZ),
    moonrise: fmt(moonTimes.rise, TZ),
    moonset: fmt(moonTimes.set, TZ),
    solarNoon: fmt(noon, TZ),
    brahmaHora: fmt(subMin(sunRise, 96), TZ),
    rahuKaal: rahuKaal(sunRise, sunSet, dayIno, TZ),
    yamagandam: yamagandam(sunRise, sunSet, dayIno, TZ),
    gulikai: gulikai(sunRise, sunSet, dayIno, TZ),
    durmuhurta: durmuhurta(sunRise, dayIno, TZ),
    varjyam: varjyam(sunRise, dayIno, TZ),
    abhijitMuhurta: abhijit(sunRise, sunSet, TZ),
    amritKaal: amritKaal(sunRise, dayIno, TZ),
    vikramSamvat: "2082",
    shakaSamvat: "1947",
    ayanamsa: parseAyanamsa(calc),
    tithiIno,
    date: d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: TZ,
    }),
    date_hi: d.toLocaleDateString("hi-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: TZ,
    }),
    locationCity: city,
  };
}

// ─────────────────────────────────────────────
// EXPORTED SERVICE  (same API — no breaking changes)
// ─────────────────────────────────────────────
export const panchangService = {
  getTodayPanchang(): PanchangData {
    return build(new Date());
  },
  getPanchangForDate(d: Date): PanchangData {
    return build(d);
  },
};
