/**
 * useNotifications.ts  — v3
 *
 * Loads preferences from AsyncStorage, exposes updatePref(),
 * and syncs user location (from usePanchangLocation — same hook CalendarScreen
 * uses) into prefs.lat / prefs.lng so library calls use real coordinates.
 *
 * Deep-links: notification tap → navigation.navigate(data.screen)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import {
  NotificationPrefs,
  CustomReminder,
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  applyAllNotificationPrefs,
  requestNotificationPermission,
  scheduleCustomReminder,
  cancelCustomReminder,
} from "../services/notificationService";
import { usePanchangLocation } from "../services/panchangService";

export interface UseNotificationsReturn {
  prefs: NotificationPrefs;
  loading: boolean;
  permissionGranted: boolean;
  updatePref: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => Promise<void>;
  addCustomReminder: (r: CustomReminder) => Promise<void>;
  removeCustomReminder: (id: string) => Promise<void>;
  toggleCustomReminder: (id: string, enabled: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS });
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermission] = useState(false);

  const notifListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Same location source CalendarScreen uses
  const { location } = usePanchangLocation();

  // Optional navigation for deep-linking
  let navigation: any = null;
  try {
    navigation = useNavigation();
  } catch {}

  // ── Load prefs on mount ────────────────────
  useEffect(() => {
    (async () => {
      const [loaded, granted] = await Promise.all([
        loadPrefs(),
        requestNotificationPermission(),
      ]);
      setPrefs(loaded);
      setPermission(granted);
      setLoading(false);
    })();
  }, []);

  // ── Sync location into prefs whenever it resolves ──
  // This mirrors how CalendarScreen passes location to Observer()
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setPrefs((prev) => {
      const updated = {
        ...prev,
        lat: location.latitude,
        lng: location.longitude,
      };
      // Persist silently — no need to re-schedule just for coord update
      savePrefs(updated).catch(() => {});
      return updated;
    });
  }, [location?.latitude, location?.longitude]);

  // ── Deep-link on notification tap ─────────
  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(
      () => {
        // foreground — no-op (alert already shown by handler)
      },
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          screen?: string;
        };
        if (!navigation || !data?.screen) return;
        try {
          navigation.navigate(data.screen as never);
        } catch {
          try {
            navigation.navigate("Main", { screen: data.screen });
          } catch {}
        }
      });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [navigation]);

  // ── Update single pref ─────────────────────
  const updatePref = useCallback(
    async <K extends keyof NotificationPrefs>(
      key: K,
      value: NotificationPrefs[K],
    ) => {
      setPrefs((prev) => {
        const updated = { ...prev, [key]: value };
        savePrefs(updated)
          .then(() => applyAllNotificationPrefs(updated))
          .catch(console.error);
        return updated;
      });
    },
    [],
  );

  // ── Custom reminder helpers ────────────────
  const addCustomReminder = useCallback(async (reminder: CustomReminder) => {
    setPrefs((prev) => {
      const updated: NotificationPrefs = {
        ...prev,
        customReminders: [...prev.customReminders, reminder],
      };
      savePrefs(updated).catch(console.error);
      if (reminder.enabled)
        scheduleCustomReminder(reminder, updated).catch(console.error);
      return updated;
    });
  }, []);

  const removeCustomReminder = useCallback(async (id: string) => {
    await cancelCustomReminder(id);
    setPrefs((prev) => {
      const updated: NotificationPrefs = {
        ...prev,
        customReminders: prev.customReminders.filter((r) => r.id !== id),
      };
      savePrefs(updated).catch(console.error);
      return updated;
    });
  }, []);

  const toggleCustomReminder = useCallback(
    async (id: string, enabled: boolean) => {
      setPrefs((prev) => {
        const updated: NotificationPrefs = {
          ...prev,
          customReminders: prev.customReminders.map((r) =>
            r.id === id ? { ...r, enabled } : r,
          ),
        };
        savePrefs(updated).catch(console.error);
        const rem = updated.customReminders.find((r) => r.id === id);
        if (rem) {
          (enabled
            ? scheduleCustomReminder(rem, updated)
            : cancelCustomReminder(id)
          ).catch(console.error);
        }
        return updated;
      });
    },
    [],
  );

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    return granted;
  }, []);

  return {
    prefs,
    loading,
    permissionGranted,
    updatePref,
    addCustomReminder,
    removeCustomReminder,
    toggleCustomReminder,
    requestPermission,
  };
}
