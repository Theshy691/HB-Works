// HB Works POS - Theme & Design System
export const colors = {
  // Backgrounds
  background: '#0B0F19',
  surface: '#151D2F',
  surfaceLight: '#1E293B',
  surfaceElevated: '#253248',
  border: '#2A374F',
  borderLight: '#384B6B',
  
  // Brand & Accents
  primary: '#007AFF',
  primaryHover: '#0056B3',
  primaryLight: 'rgba(0, 122, 255, 0.15)',
  
  // Semantic Colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  info: '#06B6D4',
  infoLight: 'rgba(6, 182, 212, 0.15)',
  
  // Text Colors
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F19',
  
  // POS Specific
  cashTender: '#34D399',
  scannerLaser: '#FF0055',
  scannerLaserGlow: 'rgba(255, 0, 85, 0.5)',
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

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const typography = {
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  monospace: {
    fontFamily: 'Courier',
    fontSize: 13,
  },
};

export const CURRENCY_SYMBOL = '₱';

export function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0.00`;
  return `${CURRENCY_SYMBOL}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
