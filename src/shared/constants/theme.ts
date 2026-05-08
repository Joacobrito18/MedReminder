export const colors = {
  primary: '#2F6FED',
  primaryDark: '#1E4FB5',
  primaryMuted: '#E7EFFE',

  bg: '#F7F8FA',
  surface: '#FFFFFF',

  text: '#0F172A',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  border: '#E2E8F0',
  divider: '#EEF1F5',

  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  success: '#16A34A',
  warning: '#D97706',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
