import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePanchangLocation } from "../services/panchangService";
import { LocationPickerModal } from "../components/LocationPicker";
import CustomSplashScreen from "@/components/SplashScreen";
import { mantraService } from "@/services/mantraService";
import { bhajanService } from "@/services/bhajanService";
import { artistService } from "@/services/artistsService";
import * as Speech from "expo-speech";
import { SidebarProvider } from "@/components/SideBar";
import { AppHeader } from "./(tabs)/_layout";
import { AppProvider } from "@/context/AppContext";
import { initI18n } from "@/services/i18n";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loc = usePanchangLocation();
  const [appReady, setAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [initialLanguage, setInitialLanguage] = useState('hi');

  const prepareApp = useCallback(async () => {
    try {
      const [lang] = await Promise.all([
        initI18n(),
        mantraService.init(),
        bhajanService.init(),
        artistService.init(),
        Speech.getAvailableVoicesAsync(),
      ]);
      setInitialLanguage(lang);
    } catch (e) {
      console.warn(e);
    } finally {
      setAppReady(true);
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    prepareApp();
  }, []);

  if (!appReady) {
    return null;
  }

  if (showCustomSplash) {
    return (
      <CustomSplashScreen
        onFinish={() => setShowCustomSplash(false)}
        appName="पञ्चाङ्ग"
        tagline="Panchang • Bhajan • Jap • Gita"
      />
    );
  }

  return (
    <AppProvider initialLanguage={initialLanguage}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SidebarProvider>
            <Stack
              screenOptions={{
                header: () => <AppHeader />,
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
            <LocationPickerModal
              visible={loc.status === "denied"}
              onDetectGPS={loc.detectGPS}
              onPickCity={loc.pickCity}
              error={loc.error}
            />
          </SidebarProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AppProvider>
  );
}
