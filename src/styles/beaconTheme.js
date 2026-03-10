/**
 * Beacon Light Theme
 * Clean, professional cybersecurity UI
 * Palette: White, Near-Black, Amber (#FFB800), Success Green (#00C853)
 */

export const colors = {
  // Backgrounds
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceLight: '#F1F3F4',

  // Primary - Amber
  primary: '#FFB800',
  primaryDark: '#E6A600',
  primaryLight: '#FFD04D',

  // Status Colors
  success: '#00C853',
  successLight: '#E8F9EF',
  successText: '#00A844',
  warning: '#FF9100',
  danger: '#FF1744',
  dangerLight: '#FFEBEE',

  // Text
  textPrimary: '#111111',
  textSecondary: '#5F6368',
  textMuted: '#9AA0A6',

  // Borders
  border: '#EBEBEB',
  borderLight: '#F4F4F4',

  // Special
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.05)',
  secureBadge: '#E8F9EF',
  secureBadgeText: '#00A844',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
};
