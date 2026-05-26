import { TextStyle } from 'react-native';

export const colors = {
  // Primary purple
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primaryDeep: '#312E81',
  primaryLight: '#EDE9FE',
  primaryMuted: '#C4B5FD',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Surfaces
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',

  // Text
  textPrimary: '#1E1B4B',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Spot status
  available: '#10B981',
  occupied: '#EF4444',
  reserved: '#F59E0B',

  // Vehicle types
  vehicleGas: '#F59E0B',
  vehicleEv: '#10B981',
  vehicleHybrid: '#3B82F6',
};

export const gradients = {
  primary: [colors.primaryDark, colors.primary, '#8B5CF6'] as const,
  primaryHorizontal: [colors.primary, colors.primaryDark] as const,
  avatar: ['#C4B5FD', '#EDE9FE'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  bodyMedium: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  bodySemiBold: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  caption: { fontSize: 13, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  button: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
};
