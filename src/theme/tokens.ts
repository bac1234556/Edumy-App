// src/theme/tokens.ts
// Three-Layer Design Tokens — Pure White & Ocean Blue (#2563EB), 100% Light Mode
// Synced with Edumy Web Frontend (src/styles/tokens.css)

import { Platform, ViewStyle, TextStyle } from 'react-native';

export const primitive = {
  white: '#FFFFFF',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',

  blue50: '#EFF6FF',
  blue200: '#BFDBFE',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',

  amber50: '#FFFBEB',
  amber200: '#FDE68A',
  amber500: '#F59E0B',
  amber700: '#B45309',

  green50: '#F0FDF4',
  green200: '#BBF7D0',
  green700: '#15803D',

  red50: '#FEF2F2',
  red200: '#FECACA',
  red600: '#DC2626',
} as const;

export const semantic = {
  // Surfaces (100% Light Mode)
  surfaceCanvas: primitive.slate50,
  surfacePage: primitive.white,
  surfaceCard: primitive.white,
  surfaceMuted: primitive.slate100,
  surfaceSubtle: primitive.slate100,

  // Borders
  borderSubtle: primitive.slate200,
  borderStrong: primitive.slate300,

  // Typography (WCAG AA >= 4.5:1)
  textPrimary: primitive.slate900,
  textBody: primitive.slate700,
  textSecondary: primitive.slate600,
  textMuted: primitive.slate500,
  textPlaceholder: primitive.slate400,

  // Brand: Ocean / Royal Blue
  brandPrimary: primitive.blue600,
  brandPrimaryHover: primitive.blue700,
  brandPrimaryStrong: primitive.blue700,
  brandPrimaryActive: primitive.blue800,
  brandSoft: primitive.blue50,
  brandBorder: primitive.blue200,

  // Rating Star
  ratingStar: primitive.amber500,

  // Semantic Status (badges, alert banners)
  success: primitive.green700,
  successSoft: primitive.green50,
  successBorder: primitive.green200,

  warning: primitive.amber700,
  warningSoft: primitive.amber50,
  warningBorder: primitive.amber200,

  danger: primitive.red600,
  dangerSoft: primitive.red50,
  dangerBorder: primitive.red200,
} as const;

export const radius = {
  btn: 8,
  input: 8,
  card: 12,
  pill: 9999,
  // Convenience aliases aligned with Web tokens
  sm: 8,
  md: 8,
  lg: 12,
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

export const layout = {
  maxContentWidth: 840,
  maxReadingWidth: 760,
} as const;

export const microShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  android: {
    elevation: 1,
  },
  web: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
