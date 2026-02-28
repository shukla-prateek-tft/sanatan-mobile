import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserLocation } from "@/hooks/useLocation";

const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_PREFIX = "nearby_temples_cache_v1";

interface GooglePlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

interface GoogleNearbyResult {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  geometry: GooglePlaceGeometry;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GoogleNearbyResponse {
  results: GoogleNearbyResult[];
  status: string;
  error_message?: string;
}

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface GoogleAutocompleteResponse {
  predictions: GoogleAutocompletePrediction[];
  status: string;
  error_message?: string;
}

interface GooglePlaceDetailsResponse {
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
  };
  status: string;
  error_message?: string;
}

export interface Temple {
  id: string;
  name: string;
  rating: number | null;
  address: string;
  latitude: number;
  longitude: number;
  openNow: boolean | null;
  distanceKm: number;
  phoneNumber?: string;
}

export interface TempleSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
  description: string;
}

interface NearbyFilters {
  distanceKm: 1 | 5 | 10;
  minRating: 0 | 4;
  openNowOnly: boolean;
}

interface UseNearbyTemplesResult {
  temples: Temple[];
  filteredTemples: Temple[];
  suggestions: TempleSuggestion[];
  loading: boolean;
  refreshing: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  filters: NearbyFilters;
  query: string;
  setQuery: (value: string) => void;
  setDistanceFilter: (value: 1 | 5 | 10) => void;
  setMinRatingFilter: (value: 0 | 4) => void;
  setOpenNowOnly: (value: boolean) => void;
  fetchNearbyTemples: (opts?: { force?: boolean }) => Promise<void>;
  refreshTemples: () => Promise<void>;
  searchTemples: (text: string) => Promise<void>;
  applySuggestion: (suggestion: TempleSuggestion) => void;
  clearSuggestions: () => void;
  ensureTemplePhone: (templeId: string) => Promise<string | undefined>;
}

function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in environment.");
  }
  return key;
}

function buildCacheKey(location: UserLocation, radiusMeters: number): string {
  return `${CACHE_PREFIX}:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${radiusMeters}`;
}

async function readCache(cacheKey: string): Promise<Temple[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; data: Temple[] };
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    return parsed.data;
  } catch {
    await AsyncStorage.removeItem(cacheKey);
    return null;
  }
}

async function writeCache(cacheKey: string, data: Temple[]): Promise<void> {
  await AsyncStorage.setItem(
    cacheKey,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    }),
  );
}

function mapAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error as AxiosError<{ error_message?: string }>;
    const remoteError = response.response?.data?.error_message;
    return remoteError ?? response.message ?? "Google Places request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong while fetching temples.";
}

export function useNearbyTemples(
  location: UserLocation | null,
): UseNearbyTemplesResult {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TempleSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [filters, setFilters] = useState<NearbyFilters>({
    distanceKm: 5,
    minRating: 0,
    openNowOnly: false,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const radiusMeters = useMemo(() => filters.distanceKm * 1000, [filters]);

  const fetchNearbyTemples = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!location) return;

      const force = opts?.force ?? false;
      const apiKey = getApiKey();
      const cacheKey = buildCacheKey(location, radiusMeters);

      setError(null);
      if (!refreshing) setLoading(true);

      try {
        if (!force) {
          const cached = await readCache(cacheKey);
          if (cached) {
            if (!mountedRef.current) return;
            setTemples(cached);
            return;
          }
        }

        const nearbyResponse = await axios.get<GoogleNearbyResponse>(
          `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`,
          {
            params: {
              key: apiKey,
              location: `${location.latitude},${location.longitude}`,
              radius: radiusMeters,
              keyword: "temple",
              type: "hindu_temple",
            },
            timeout: 15000,
          },
        );

        if (nearbyResponse.data.status !== "OK" && nearbyResponse.data.status !== "ZERO_RESULTS") {
          throw new Error(
            nearbyResponse.data.error_message ??
              `Google Places error: ${nearbyResponse.data.status}`,
          );
        }

        const mapped: Temple[] = nearbyResponse.data.results.map((item) => ({
          id: item.place_id,
          name: item.name,
          rating: item.rating ?? null,
          address: item.vicinity ?? "Address unavailable",
          latitude: item.geometry.location.lat,
          longitude: item.geometry.location.lng,
          openNow: item.opening_hours?.open_now ?? null,
          distanceKm: haversineDistanceKm(
            location.latitude,
            location.longitude,
            item.geometry.location.lat,
            item.geometry.location.lng,
          ),
        }));

        await writeCache(cacheKey, mapped);
        if (!mountedRef.current) return;
        setTemples(mapped);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(mapAxiosError(e));
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [location, radiusMeters, refreshing],
  );

  const refreshTemples = useCallback(async () => {
    setRefreshing(true);
    await fetchNearbyTemples({ force: true });
  }, [fetchNearbyTemples]);

  const searchTemples = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    const apiKey = getApiKey();
    setSuggestionsLoading(true);
    try {
      const response = await axios.get<GoogleAutocompleteResponse>(
        `${GOOGLE_PLACES_BASE_URL}/autocomplete/json`,
        {
          params: {
            key: apiKey,
            input: text,
            types: "establishment",
            components: "country:in",
            strictbounds: false,
          },
          timeout: 10000,
        },
      );

      if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
        throw new Error(
          response.data.error_message ??
            `Autocomplete error: ${response.data.status}`,
        );
      }

      const mapped = response.data.predictions
        .filter((item) => item.description.toLowerCase().includes("temple"))
        .slice(0, 6)
        .map<TempleSuggestion>((item) => ({
          placeId: item.place_id,
          title: item.structured_formatting?.main_text ?? item.description,
          subtitle: item.structured_formatting?.secondary_text ?? "",
          description: item.description,
        }));
      if (!mountedRef.current) return;
      setSuggestions(mapped);
    } catch {
      if (!mountedRef.current) return;
      setSuggestions([]);
    } finally {
      if (!mountedRef.current) return;
      setSuggestionsLoading(false);
    }
  }, []);

  const applySuggestion = useCallback((suggestion: TempleSuggestion) => {
    setQuery(suggestion.title);
    setSuggestions([]);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const ensureTemplePhone = useCallback(
    async (templeId: string): Promise<string | undefined> => {
      const existing = temples.find((t) => t.id === templeId)?.phoneNumber;
      if (existing) return existing;

      try {
        const apiKey = getApiKey();
        const response = await axios.get<GooglePlaceDetailsResponse>(
          `${GOOGLE_PLACES_BASE_URL}/details/json`,
          {
            params: {
              key: apiKey,
              place_id: templeId,
              fields: "formatted_phone_number,international_phone_number",
            },
            timeout: 10000,
          },
        );
        const phone =
          response.data.result?.international_phone_number ??
          response.data.result?.formatted_phone_number;
        if (!phone) return undefined;

        setTemples((prev) =>
          prev.map((item) =>
            item.id === templeId ? { ...item, phoneNumber: phone } : item,
          ),
        );
        return phone;
      } catch {
        return undefined;
      }
    },
    [temples],
  );

  const filteredTemples = useMemo(() => {
    const bySearch = query.trim()
      ? temples.filter((t) =>
          t.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : temples;

    return bySearch
      .filter((t) => t.distanceKm <= filters.distanceKm)
      .filter((t) => (filters.minRating === 4 ? (t.rating ?? 0) >= 4 : true))
      .filter((t) =>
        filters.openNowOnly ? t.openNow === true : true,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [temples, query, filters]);

  useEffect(() => {
    fetchNearbyTemples();
  }, [fetchNearbyTemples]);

  const setDistanceFilter = useCallback((value: 1 | 5 | 10) => {
    setFilters((prev) => ({ ...prev, distanceKm: value }));
  }, []);

  const setMinRatingFilter = useCallback((value: 0 | 4) => {
    setFilters((prev) => ({ ...prev, minRating: value }));
  }, []);

  const setOpenNowOnly = useCallback((value: boolean) => {
    setFilters((prev) => ({ ...prev, openNowOnly: value }));
  }, []);

  return {
    temples,
    filteredTemples,
    suggestions,
    loading,
    refreshing,
    suggestionsLoading,
    error,
    filters,
    query,
    setQuery,
    setDistanceFilter,
    setMinRatingFilter,
    setOpenNowOnly,
    fetchNearbyTemples,
    refreshTemples,
    searchTemples,
    applySuggestion,
    clearSuggestions,
    ensureTemplePhone,
  };
}
