export type AppTheme = 'maroon' | 'saffron' | 'lotus' | 'ocean' | 'forest';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  cardBg: string;
  cardBorder: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlay: string;
  shadow: string;
  glow: string;
  diyaFlame: string;
  diyaGlow: string;
  moonLight: string;
  transparent: string;
}

const maroon: ThemeColors = {
  primary: '#8B0000',
  primaryDark: '#4A0E0E',
  primaryLight: '#A52A2A',
  gold: '#D4AF37',
  goldLight: '#FFD700',
  goldDark: '#B8860B',
  bgPrimary: '#1A0A0A',
  bgSecondary: '#2D1414',
  bgTertiary: '#3D1F1F',
  textPrimary: '#FFF8DC',
  textSecondary: '#D4AF37',
  textMuted: '#B8A594',
  textInverse: '#1A0A0A',
  cardBg: '#2D1414CC',
  cardBorder: '#D4AF3733',
  divider: '#D4AF3722',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  overlay: '#00000080',
  shadow: '#00000040',
  glow: '#D4AF3740',
  diyaFlame: '#FF6B00',
  diyaGlow: '#FFA50080',
  moonLight: '#E8E8E8',
  transparent: 'transparent',
};

const saffron: ThemeColors = {
  primary: '#CC5500',
  primaryDark: '#7A2E00',
  primaryLight: '#E86A20',
  gold: '#FFD700',
  goldLight: '#FFEC6E',
  goldDark: '#E6A800',
  bgPrimary: '#1A0800',
  bgSecondary: '#2D1400',
  bgTertiary: '#3D1E00',
  textPrimary: '#FFF8DC',
  textSecondary: '#FFD700',
  textMuted: '#C4A882',
  textInverse: '#1A0800',
  cardBg: '#2D1400CC',
  cardBorder: '#FFD70033',
  divider: '#FFD70022',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  overlay: '#00000080',
  shadow: '#00000040',
  glow: '#FFD70040',
  diyaFlame: '#FF6B00',
  diyaGlow: '#FFA50080',
  moonLight: '#E8E8E8',
  transparent: 'transparent',
};

const lotus: ThemeColors = {
  primary: '#AD1457',
  primaryDark: '#6A0F38',
  primaryLight: '#C2185B',
  gold: '#FFB6C1',
  goldLight: '#FFC8D0',
  goldDark: '#E8A4AF',
  bgPrimary: '#1A080F',
  bgSecondary: '#2D1020',
  bgTertiary: '#3D1530',
  textPrimary: '#FFF0F5',
  textSecondary: '#FFB6C1',
  textMuted: '#C49AAA',
  textInverse: '#1A080F',
  cardBg: '#2D1020CC',
  cardBorder: '#FFB6C133',
  divider: '#FFB6C122',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  overlay: '#00000080',
  shadow: '#00000040',
  glow: '#FFB6C140',
  diyaFlame: '#FF6B9D',
  diyaGlow: '#FF69B480',
  moonLight: '#E8E8E8',
  transparent: 'transparent',
};

const ocean: ThemeColors = {
  primary: '#1565C0',
  primaryDark: '#0D3C78',
  primaryLight: '#1976D2',
  gold: '#90CAF9',
  goldLight: '#E0F0FF',
  goldDark: '#64B5F6',
  bgPrimary: '#07101A',
  bgSecondary: '#0D1B35',
  bgTertiary: '#112244',
  textPrimary: '#E8F4FD',
  textSecondary: '#90CAF9',
  textMuted: '#7B9EBC',
  textInverse: '#07101A',
  cardBg: '#0D1B35CC',
  cardBorder: '#90CAF933',
  divider: '#90CAF922',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  overlay: '#00000080',
  shadow: '#00000040',
  glow: '#90CAF940',
  diyaFlame: '#64B5F6',
  diyaGlow: '#90CAF980',
  moonLight: '#E0F0FF',
  transparent: 'transparent',
};

const forest: ThemeColors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#388E3C',
  gold: '#D4AF37',
  goldLight: '#FFD700',
  goldDark: '#B8860B',
  bgPrimary: '#070D07',
  bgSecondary: '#0D1A0D',
  bgTertiary: '#112611',
  textPrimary: '#F1F8E9',
  textSecondary: '#D4AF37',
  textMuted: '#8FAF8F',
  textInverse: '#070D07',
  cardBg: '#0D1A0DCC',
  cardBorder: '#D4AF3733',
  divider: '#D4AF3722',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  overlay: '#00000080',
  shadow: '#00000040',
  glow: '#D4AF3740',
  diyaFlame: '#76C442',
  diyaGlow: '#8BC34A80',
  moonLight: '#E8FFE8',
  transparent: 'transparent',
};

export const themes: Record<AppTheme, ThemeColors> = {
  maroon,
  saffron,
  lotus,
  ocean,
  forest,
};

export const THEME_GRADIENTS: Record<AppTheme, [string, string, string]> = {
  maroon: ['#1A0A0A', '#2D1414', '#4A0E0E'],
  saffron: ['#1A0800', '#2D1400', '#4A2200'],
  lotus: ['#1A080F', '#2D1020', '#4A1535'],
  ocean: ['#07101A', '#0D1B35', '#112244'],
  forest: ['#070D07', '#0D1A0D', '#152015'],
};

export const THEME_DISPLAY_NAMES: Record<AppTheme, string> = {
  maroon: 'Temple Maroon',
  saffron: 'Saffron',
  lotus: 'Lotus Pink',
  ocean: 'Ocean Blue',
  forest: 'Forest Green',
};

export const THEME_ACCENT_COLORS: Record<AppTheme, string> = {
  maroon: '#8B0000',
  saffron: '#CC5500',
  lotus: '#AD1457',
  ocean: '#1565C0',
  forest: '#2E7D32',
};
