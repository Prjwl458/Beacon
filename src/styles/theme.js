/**
 * Cyber-Intelligence Theme for Phish-It
 * A dark, modern theme with electric blue accents
 */

// Color Palette
export const colors = {
  // Primary
  primary: '#00E5FF',
  primaryDark: '#00B8D4',
  primaryLight: '#6EFFFF',
  
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2C2C2C',
  
  // Status Colors
  success: '#00E676',
  warning: '#FF9100',
  danger: '#FF5252',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9E9E9E',
  textMuted: '#616161',
  
  // Borders
  border: '#333333',
  borderLight: '#444444',
  
  // Special
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Spacing Scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Typography
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Risk Level Colors
export const riskColors = {
  low: colors.success,
  medium: colors.warning,
  high: colors.danger,
};

// Get risk color based on score
export const getRiskColor = (score) => {
  if (score >= 70) return riskColors.high;
  if (score >= 40) return riskColors.medium;
  return riskColors.low;
};

// Server Status Colors
export const statusColors = {
  OFFLINE: colors.danger,
  WAKING_UP: colors.warning,
  LIVE: colors.success,
};

// Theme Object (for easier importing)
const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  riskColors,
  getRiskColor,
  statusColors,
};

export default theme;
