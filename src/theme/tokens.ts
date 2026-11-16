// src/theme/tokens.ts
// Three-Layer Design Tokens (Primitive -> Semantic -> Component)
// Compliant with ui-ux-pro-max, design-system & Anti-AI-Slop Manifesto.

import { Platform, ViewStyle, TextStyle } from 'react-native';

export const primitive = {
  stone50: '#FAF9F6',   // Warm Editorial Paper
  stone100: '#F4F2ED',  // Secondary Warm Surface
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  cinema950: '#0B0F17', // Modern Dark Cinema

  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal500: '#14B8A6',
  teal600: '#0D9488',   // Brand Primary Deep Teal
  teal700: '#0F766E',

  cobalt50: '#EFF6FF',
  cobalt100: '#DBEAFE',
  cobalt600: '#2563EB',
  cobalt700: '#1D4ED8', // Crisp Cobalt

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber500: '#F59E0B',
  amber600: '#D97706',
  vermilion600: '#EA580C',

  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',

  rose50: '#FEF2F2',
  rose100: '#FEE2E2',
  rose500: '#EF4444',
  rose600: '#DC2626',

  white: '#FFFFFF',
} as const;

export const semantic = {
  surfaceCanvas: primitive.stone50,
  surfaceCard: primitive.white,
  surfaceElevated: primitive.slate50,
  surfaceSubtle: primitive.stone100,
  surfaceCinema: primitive.cinema950,

  borderSubtle: primitive.slate200,
  borderStrong: primitive.slate300,
  borderDark: primitive.slate800,

  textPrimary: primitive.slate900,
  textSecondary: primitive.slate600,
  textMuted: primitive.slate500,
  textPlaceholder: primitive.slate400,
  textInverse: primitive.slate50,

  brandPrimary: primitive.teal600,
  brandPrimaryStrong: primitive.teal700,
  brandSoft: primitive.teal50,
  brandBorder: primitive.teal200,

  accentCobalt: primitive.cobalt700,
  accentCobaltSoft: primitive.cobalt50,

  accentAmber: primitive.amber600,
  accentAmberSoft: primitive.amber50,

  success: primitive.emerald600,
  successSoft: primitive.emerald50,

  danger: primitive.rose600,
  dangerSoft: primitive.rose50,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const microShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  android: {
    elevation: 1,
  },
  default: {},
}) as ViewStyle;

export const monoFontFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const tabularNumsStyle: TextStyle = {
  fontVariant: ['tabular-nums'],
};
