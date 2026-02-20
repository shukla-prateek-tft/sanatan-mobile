import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerPushNotifications() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Push Token:", token);

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("live", {
      name: "Live Darshan",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return token;
}

// Local test notification
export async function sendLocalLiveNotification(title: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔴 Live Darshan Started",
      body: title,
    },
    trigger: null,
  });
}
