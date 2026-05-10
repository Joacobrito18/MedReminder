export const colors = {
  primary: '#2A4A87',
  primaryDark: '#1F3868',
  primaryMuted: '#E6ECF6',

  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#FAF7F1',

  text: '#1A1D24',
  textSoft: '#3D424C',
  textMuted: '#6B7280',
  textMutedSoft: '#9AA0AB',
  textOnPrimary: '#FFFFFF',

  border: '#E6E8EC',
  divider: '#F0F1F4',

  danger: '#B84141',
  dangerMuted: '#F6E4E1',
  success: '#4F8B5C',
  successMuted: '#E4EFE6',
  warning: '#B07A1F',
  warningMuted: '#F4EAD6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 30,
  hero: 48,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
