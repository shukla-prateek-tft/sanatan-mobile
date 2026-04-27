import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  JAP_COUNT: '@sanatan_jap_count',
  JAP_HISTORY: '@sanatan_jap_history',
  SELECTED_MANTRA: '@sanatan_selected_mantra',
  BOOKMARKS: '@sanatan_bookmarks',
  THEME_MODE: '@sanatan_theme_mode',
  FONT_SIZE: '@sanatan_font_size',
  APP_THEME: '@sanatan_app_theme',
  LANGUAGE: '@sanatan_language',
};

export const storageService = {
  // Jap Counter
  async saveJapCount(count: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.JAP_COUNT, count.toString());
  },

  async getJapCount(): Promise<number> {
    const count = await AsyncStorage.getItem(KEYS.JAP_COUNT);
    return count ? parseInt(count, 10) : 0;
  },

  async saveJapHistory(history: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.JAP_HISTORY, JSON.stringify(history));
  },

  async getJapHistory(): Promise<any[]> {
    const history = await AsyncStorage.getItem(KEYS.JAP_HISTORY);
    return history ? JSON.parse(history) : [];
  },

  async saveSelectedMantra(mantra: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SELECTED_MANTRA, mantra);
  },

  async getSelectedMantra(): Promise<string> {
    const mantra = await AsyncStorage.getItem(KEYS.SELECTED_MANTRA);
    return mantra || 'ॐ नमः शिवाय';
  },

  // Bookmarks
  async saveBookmarks(bookmarks: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  async getBookmarks(): Promise<string[]> {
    const bookmarks = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return bookmarks ? JSON.parse(bookmarks) : [];
  },

  // Settings
  async saveThemeMode(mode: 'light' | 'dark'): Promise<void> {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  },

  async getThemeMode(): Promise<'light' | 'dark'> {
    const mode = await AsyncStorage.getItem(KEYS.THEME_MODE);
    return (mode as 'light' | 'dark') || 'dark';
  },

  async saveFontSize(size: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.FONT_SIZE, size.toString());
  },

  async getFontSize(): Promise<number> {
    const size = await AsyncStorage.getItem(KEYS.FONT_SIZE);
    return size ? parseInt(size, 10) : 16;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  },
};
