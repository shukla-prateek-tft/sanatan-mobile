import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Linking } from "react-native";

export type LocationPermissionState = "idle" | "granted" | "denied";

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UseLocationResult {
  location: UserLocation | null;
  permission: LocationPermissionState;
  loading: boolean;
  error: string | null;
  requestPermissionAndLocate: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  openSettings: () => Promise<void>;
}

const GEO_OPTIONS = {
  accuracy: Location.Accuracy.High,
};

function mapGeoError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("denied")) return "Location permission denied.";
    if (msg.includes("timeout")) return "Location request timed out. Please retry.";
    if (msg.includes("unavailable")) return "Location unavailable. Please try again.";
  }
  return "Failed to fetch location.";
}

function getLocationOnce() {
  return Location.getCurrentPositionAsync(GEO_OPTIONS);
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permission, setPermission] = useState<LocationPermissionState>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getLocationOnce();
      if (!mountedRef.current) return;
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setPermission("granted");
    } catch (e) {
      if (!mountedRef.current) return;
      const message = mapGeoError(e);
      setError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const requestPermissionAndLocate = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setPermission("denied");
      setError("Location permission denied.");
      return;
    }

    await fetchLocation();
  }, [fetchLocation]);

  const refreshLocation = useCallback(async () => {
    await fetchLocation();
  }, [fetchLocation]);

  const openSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  useEffect(() => {
    requestPermissionAndLocate();
  }, [requestPermissionAndLocate]);

  return {
    location,
    permission,
    loading,
    error,
    requestPermissionAndLocate,
    refreshLocation,
    openSettings,
  };
}
