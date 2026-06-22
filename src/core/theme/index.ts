export const colors = {
  primary: '#E8336D',
  primaryDark: '#C41850',
  background: '#0D1B3E',
  surface: '#152447',
  surfaceElevated: '#1A2E58',
  overlay: 'rgba(10, 18, 45, 0.78)',
  quoteBox: 'rgba(30, 50, 100, 0.60)',
  text: '#FFFFFF',
  textSecondary: '#A0B0CC',
  textMuted: '#6B7FA3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  border: '#1E3060',
  inputBg: '#0F2040',
  black: '#000000',
  warningBright: '#FFC107',
  modalScrim: {
    light: 'rgba(0,0,0,0.45)',
    medium: 'rgba(0,0,0,0.5)',
    scrim: 'rgba(0,0,0,0.55)',
    heavy: 'rgba(0,0,0,0.7)',
  },
  medal: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 56,
  hero: 64,
  countdown: 140,
  trackingLarge: 48,
  trackingMedium: 36,
  trackingSmall: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  avatar: 60,
};

export const sizes = {
  avatar: 120,
};

export const typography = {
  sectionLabel:  { color: colors.primary, fontSize: 16, fontWeight: '700' as const },
  itemTitle:     { color: colors.text, fontSize: 16, fontWeight: '700' as const },
  body:          { color: colors.text, fontSize: 16 },
  caption:       { color: colors.textSecondary, fontSize: 13 },
  muted:         { color: colors.textMuted, fontSize: 13 },
  label:         { color: colors.text, fontSize: 13, fontWeight: '600' as const },
};
