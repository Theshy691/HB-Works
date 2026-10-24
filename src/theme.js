// HB Works POS - Professional Design Tokens & Theme Engine
// Motorsport Obsidian & Carbon High-Performance Design System

export const colors = {
  // Deep Chassis & Backgrounds
  background: '#090A0E',
  backgroundElevated: '#0E1117',
  
  // Surfaces & Cards
  surface: '#13161F',
  surfaceLight: '#1A1E2B',
  surfaceElevated: '#222738',
  surfaceActive: '#2C3347',
  
  // High-Precision Translucent Glass Borders (No more harsh AI slop solid grey borders)
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderHighlight: 'rgba(239, 68, 68, 0.35)',
  
  // HB Works Brand Identity - Motorsport Racing Red & Speed Accents
  primary: '#EF4444',
  primaryHover: '#DC2626',
  primaryLight: 'rgba(239, 68, 68, 0.15)',
  primaryGlow: 'rgba(239, 68, 68, 0.25)',
  
  // High-Visibility POS Register Accents
  cashTender: '#10B981',
  cashTenderLight: 'rgba(16, 185, 129, 0.15)',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.12)',
  danger: '#F43F5E',
  dangerLight: 'rgba(244, 63, 94, 0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.12)',
  
  // Typography - High Contrast Hierarchy
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',
  textInverse: '#090A0E',
  
  // Hardware & Scanner Visuals
  scannerLaser: '#FF003C',
  scannerLaserGlow: 'rgba(255, 0, 60, 0.6)',
  
  // Badges & Categorical Tones
  badgeNeutral: 'rgba(255, 255, 255, 0.06)',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
};

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  titleMedium: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
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

