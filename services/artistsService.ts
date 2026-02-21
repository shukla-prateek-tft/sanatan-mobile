import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
const ARTISTS: Artist[] = [
  {
    id: "a1",
    name: "Anup Jalota",
    nameHi: "अनूप जलोटा",
    deity: "Bhakti",
    deityHi: "भक्ति",
    description: "Bhajan Samrat — master of devotional music",
    emoji: "🎙️",
    youtubeQuery: "Anup Jalota bhajan",
    color: "#F97316",
    tags: ["Live", "Classic"],
  },
  {
    id: "a2",
    name: "Lata Mangeshkar",
    nameHi: "लता मंगेशकर",
    deity: "All",
    deityHi: "सर्व",
    description: "Nightingale of India — timeless devotional songs",
    emoji: "🎵",
    youtubeQuery: "Lata Mangeshkar bhajan",
    color: "#EC4899",
    tags: ["Classic", "Melodious"],
  },
  {
    id: "a3",
    name: "Anuradha Paudwal",
    nameHi: "अनुराधा पौडवाल",
    deity: "Durga",
    deityHi: "दुर्गा",
    description: "Queen of devotional — Aarti & Stotrams",
    emoji: "🌸",
    youtubeQuery: "Anuradha Paudwal bhajan",
    color: "#A855F7",
    tags: ["Aarti", "Navratri"],
  },
  {
    id: "a4",
    name: "Pandit Jasraj",
    nameHi: "पं॰ जसराज",
    deity: "Vishnu",
    deityHi: "विष्णु",
    description: "Classical Haveli Sangeet — divine Mewati gharana",
    emoji: "🕉️",
    youtubeQuery: "Pandit Jasraj bhajan",
    color: "#3B82F6",
    tags: ["Classical", "Rare"],
  },
  {
    id: "a5",
    name: "Narendra Chanchal",
    nameHi: "नरेंद्र चंचल",
    deity: "Durga",
    deityHi: "दुर्गा",
    description: "Legendary Mata ki chowki singer",
    emoji: "🔱",
    youtubeQuery: "Narendra Chanchal mata bhajan",
    color: "#EF4444",
    tags: ["Navratri", "Live"],
  },
  {
    id: "a6",
    name: "MS Subbulakshmi",
    nameHi: "एम॰एस॰ सुब्बुलक्ष्मी",
    deity: "Vishnu",
    deityHi: "विष्णु",
    description: "Carnatic Bhakti — Venkateshwara Suprabhatam",
    emoji: "✨",
    youtubeQuery: "MS Subbulakshmi bhajan",
    color: "#F59E0B",
    tags: ["Carnatic", "South"],
  },
  {
    id: "a7",
    name: "Kailash Kher",
    nameHi: "कैलाश खेर",
    deity: "Shiva",
    deityHi: "शिव",
    description: "Sufi-folk devotional — Teri Deewani, Allah Ke Bande",
    emoji: "🌙",
    youtubeQuery: "Kailash Kher bhajan shiva",
    color: "#6366F1",
    tags: ["Sufi", "Modern"],
  },
  {
    id: "a8",
    name: "Hemant Chauhan",
    nameHi: "हेमंत चौहान",
    deity: "Krishna",
    deityHi: "कृष्ण",
    description: "Gujarati bhajan — Vaishnav Jan To",
    emoji: "🪈",
    youtubeQuery: "Hemant Chauhan krishna bhajan",
    color: "#10B981",
    tags: ["Gujarati", "Krishna"],
  },
  {
    id: "a9",
    name: "Jagjit Singh",
    nameHi: "जगजीत सिंह",
    deity: "Bhakti",
    deityHi: "भक्ति",
    description: "Ghazal king — soulful devotional renditions",
    emoji: "🎸",
    youtubeQuery: "Jagjit Singh bhajan",
    color: "#8B5CF6",
    tags: ["Ghazal", "Soulful"],
  },
  {
    id: "a10",
    name: "ISKCON Devotees",
    nameHi: "इस्कॉन",
    deity: "Krishna",
    deityHi: "कृष्ण",
    description: "Hare Krishna kirtan — Radhe Radhe",
    emoji: "🪬",
    youtubeQuery: "ISKCON Hare Krishna kirtan",
    color: "#F97316",
    tags: ["Kirtan", "Live"],
  },
];
export interface Artist {
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

let _cache: Artist[] = [];
let _initialized = false;

async function fetchFromFirebase(): Promise<Artist[]> {
  const snap = await getDocs(collection(db, "artists"));
  if (snap.empty) return [];

  return snap.docs.map((doc) => {
    const d = doc.data();

    return {
      id: d.id ?? doc.id,
      name: d.name ?? "Unknown Artist",
      nameHi: d.nameHi ?? "",
      deity: d.deity ?? "Unknown",
      deityHi: d.deityHi ?? "",
      description: d.description ?? "",
      emoji: d.emoji ?? "🎵",
      youtubeQuery: d.youtubeQuery ?? "",
      color: d.color ?? "#6366F1",
      tags: Array.isArray(d.tags) ? d.tags : [],
    };
  });
}

export const artistService = {
  async init(): Promise<void> {
    if (_initialized) return;

    try {
      const firebase = await fetchFromFirebase();
      _cache = firebase.length > 0 ? [...firebase, ...ARTISTS] : ARTISTS;
    } catch (err) {
      console.warn(
        "[artistService] Firebase fetch failed, using empty cache:",
        err,
      );
    } finally {
      _initialized = true;
    }
  },

  async refresh(): Promise<Artist[]> {
    try {
      const firebase = await fetchFromFirebase();
      _cache = firebase.length > 0 ? [...firebase, ...ARTISTS] : ARTISTS;
    } catch (err) {
      console.warn("[artistService] Refresh failed, keeping cache:", err);
    }
    return _cache;
  },

  getAllArtists(): Artist[] {
    return _cache;
  },

  getArtistsByDeity(deity: string): Artist[] {
    return _cache.filter((a) => a.deity.toLowerCase() === deity.toLowerCase());
  },

  getArtistById(id: string): Artist | undefined {
    return _cache.find((a) => a.id === id);
  },

  searchArtists(query: string): Artist[] {
    const q = query.toLowerCase();
    return _cache.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.nameHi.includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  get isLoaded(): boolean {
    return _initialized;
  },
};
