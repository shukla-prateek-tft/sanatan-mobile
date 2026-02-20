// ─────────────────────────────────────────────────────────
// Hindi (Devanagari) lookup maps for mhah-panchanga
//
// IMPORTANT: mhah-panchanga returns .ino (index 0-based) for
// Masa, Ritu, Raasi — NOT a string key. So we export both
// index arrays AND name→Hindi maps for flexibility.
// ─────────────────────────────────────────────────────────

// ── By index (ino) ─────────────────────────────────────

export const TITHI_EN: string[] = [
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

export const TITHI_HI: string[] = [
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

export const NAKSHATRA_EN: string[] = [
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

export const NAKSHATRA_HI: string[] = [
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

export const YOGA_EN: string[] = [
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

export const YOGA_HI: string[] = [
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

export const KARANA_EN: string[] = [
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

export const KARANA_HI: string[] = [
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

// Masa: index 0=Chaitra … 11=Phalguna
export const MASA_EN: string[] = [
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

export const MASA_HI: string[] = [
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

// Ritu: index 0=Vasanta … 5=Shishira (one per two months)
export const RITU_EN: string[] = [
  "Vasanta",
  "Grishma",
  "Varsha",
  "Sharad",
  "Hemanta",
  "Shishira",
];

export const RITU_HI: string[] = [
  "वसन्त",
  "ग्रीष्म",
  "वर्षा",
  "शरद",
  "हेमन्त",
  "शिशिर",
];

// Raasi: index 0=Mesha … 11=Meena
export const RAASI_EN: string[] = [
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

export const RAASI_HI: string[] = [
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

export const VARA_EN: string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const VARA_HI: string[] = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
];

export const PAKSHA_HI: Record<string, string> = {
  Shukla: "शुक्ल पक्ष",
  Krishna: "कृष्ण पक्ष",
};

// ── UI label strings ────────────────────────────────────

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
  deity: "देवता",
  ends: "समाप्ति",
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

/** Safe index lookup — returns English name if index out of range */
export function byIno<T>(arr: T[], ino: number | undefined, fallback: T): T {
  if (ino === undefined || ino < 0 || ino >= arr.length) return fallback;
  return arr[ino];
}
