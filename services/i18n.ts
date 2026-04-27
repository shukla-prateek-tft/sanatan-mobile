import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import sa from '../locales/sa.json';
import bn from '../locales/bn.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';

const LANGUAGE_KEY = '@sanatan_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi' },
  { code: 'mr', name: 'मराठी', nativeName: 'Marathi' },
  { code: 'sa', name: 'संस्कृत', nativeName: 'Sanskrit' },
  { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
  { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
  { code: 'ml', name: 'മലയാളം', nativeName: 'Malayalam' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

let initialized = false;

export async function initI18n(): Promise<string> {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!savedLanguage || !SUPPORTED_LANGUAGES.find(l => l.code === savedLanguage)) {
    savedLanguage = 'hi';
  }

  if (!initialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        mr: { translation: mr },
        sa: { translation: sa },
        bn: { translation: bn },
        ta: { translation: ta },
        te: { translation: te },
        ml: { translation: ml },
      },
      lng: savedLanguage,
      fallbackLng: 'hi',
      interpolation: { escapeValue: false },
    });
    initialized = true;
  } else {
    await i18n.changeLanguage(savedLanguage);
  }

  return savedLanguage;
}

export async function changeLanguage(code: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export { i18n };
