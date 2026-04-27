import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, AppTheme, ThemeColors, THEME_GRADIENTS } from '../theme/themes';
import { changeLanguage } from '../services/i18n';

const THEME_KEY = '@sanatan_app_theme';

interface AppContextType {
  themeKey: AppTheme;
  themeColors: ThemeColors;
  themeGradient: [string, string, string];
  setTheme: (theme: AppTheme) => Promise<void>;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  themeKey: 'maroon',
  themeColors: themes.maroon,
  themeGradient: THEME_GRADIENTS.maroon,
  setTheme: async () => {},
  language: 'hi',
  setLanguage: async () => {},
});

export function AppProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: string;
}) {
  const [themeKey, setThemeKey] = useState<AppTheme>('maroon');
  const [language, setLanguageState] = useState(initialLanguage);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved && saved in themes) {
        setThemeKey(saved as AppTheme);
      }
    });
  }, []);

  const setTheme = useCallback(async (theme: AppTheme) => {
    setThemeKey(theme);
    await AsyncStorage.setItem(THEME_KEY, theme);
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    setLanguageState(lang);
    await changeLanguage(lang);
  }, []);

  return (
    <AppContext.Provider
      value={{
        themeKey,
        themeColors: themes[themeKey],
        themeGradient: THEME_GRADIENTS[themeKey],
        setTheme,
        language,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppTheme(): AppContextType {
  return useContext(AppContext);
}
