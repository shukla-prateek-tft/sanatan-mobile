import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
// import * as SplashScreen from "expo-splash-screen";
import { usePanchangLocation } from "../services/panchangService";
import { LocationPickerModal } from "../components/LocationPicker";
import CustomSplashScreen from "@/components/SplashScreen";
// Keep the splash screen visible while we fetch resources
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loc = usePanchangLocation();

  // useEffect(() => {
  //   // Hide splash screen after a delay
  //   setTimeout(() => {
  //     SplashScreen.hideAsync();
  //   }, 2000);
  // }, []);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <CustomSplashScreen
        onFinish={() => setShowSplash(false)}
        appName="पञ्चाङ्ग"
        tagline="Panchang • Bhajan • Jap • Gita"
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <LocationPickerModal
        visible={loc.status === "denied"}
        onDetectGPS={loc.detectGPS}
        onPickCity={loc.pickCity}
        error={loc.error}
      />
    </Stack>
  );
}
