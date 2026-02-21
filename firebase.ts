import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBdiGOxk6lGXDF3OwrN1Yt92HLBl0XCSjg",
  authDomain: "shantan-4e56f.firebaseapp.com",
  projectId: "shantan-4e56f",
  storageBucket: "shantan-4e56f.firebasestorage.app",
  messagingSenderId: "38940315873",
  appId: "1:38940315873:web:3a0ced06d0c61da325e7a0",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
