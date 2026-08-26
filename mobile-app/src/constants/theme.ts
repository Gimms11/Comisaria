import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',

    // Brand / Police Civic Palette
    primary: '#047857', // Emerald Police Green
    primaryDark: '#064E3B',
    primaryLight: '#D1FAE5',
    primaryContrast: '#FFFFFF',

    // Accents
    accent: '#0284C7', // Civic Blue
    accentLight: '#E0F2FE',
    danger: '#DC2626', // Emergency Red
    dangerLight: '#FEE2E2',
    warning: '#D97706', // Alert Amber
    warningLight: '#FEF3C7',
    success: '#16A34A',
    successLight: '#DCFCE7',

    border: '#E2E8F0',
    tint: '#047857',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#090D16',
    card: '#131B2E',
    cardBorder: '#1E293B',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',

    // Brand
    primary: '#10B981',
    primaryDark: '#047857',
    primaryLight: '#064E3B',
    primaryContrast: '#042F2E',

    // Accents
    accent: '#38BDF8',
    accentLight: '#0C4A6E',
    danger: '#EF4444',
    dangerLight: '#450A0A',
    warning: '#F59E0B',
    warningLight: '#451A03',
    success: '#22C55E',
    successLight: '#052E16',

    border: '#1E293B',
    tint: '#10B981',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, Cambria, serif',
    rounded: 'ui-rounded, sans-serif',
    mono: 'ui-monospace, Menlo, Monaco, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 75 }) ?? 60;
export const MaxContentWidth = 840;
