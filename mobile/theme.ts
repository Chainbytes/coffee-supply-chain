import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const colors = {
  // Coffee palette
  coffeeDark: '#2C1810',       // darkest brown — login bg
  coffeeBrown: '#5C3317',      // deep espresso
  coffeeMedium: '#8B5E3C',     // warm coffee
  coffeeLight: '#C4956A',      // latte

  // Forest greens
  forest: '#2D5016',           // primary green
  forestLight: '#4A7C2F',      // lighter green
  forestMuted: '#6B8F4A',      // muted

  // Cream
  cream: '#FFF8E7',
  creamDark: '#F5EDD4',

  // Bitcoin orange
  lightning: '#F7931A',        // Bitcoin/Lightning orange
  lightningDark: '#D4780E',

  // Semantic
  success: '#388E3C',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#1976D2',

  // Neutrals
  white: '#FFFFFF',
  surface: '#FFF8E7',
  background: '#2C1810',
  text: '#2C2C2C',
  textLight: '#FFF8E7',
  textMuted: '#7A7A7A',
  border: '#E0D5B7',
  divider: '#EADFBF',

  // Legacy aliases
  primary: '#2D5016',
  accent: '#C4956A',
  bark: '#8B5E3C',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  body: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const typography = {
  fontSize,
  lineHeight: {
    xs: 16,
    sm: 20,
    body: 24,
    lg: 26,
    xl: 30,
    xxl: 36,
    hero: 44,
  },
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const layout = {
  screenPadding: spacing.xl,
  contentWidth: screenWidth - spacing.xl * 2,
  buttonHeight: {
    lg: 52,
    md: 44,
    sm: 36,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontFamily,
  typography,
  shadow,
  layout,
} as const;

export default theme;
