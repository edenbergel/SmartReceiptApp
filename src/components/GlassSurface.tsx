import { PropsWithChildren } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { radius } from '../theme/metrics';

export type GlassVariant = 'soft' | 'strong' | 'subtle' | 'default';

interface GlassSurfaceProps {
  variant?: GlassVariant;
  style?: StyleProp<ViewStyle>;
}

const variantMap: Record<GlassVariant, { colors: readonly [string, string]; borderColor: string }> = {
  soft: {
    colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
    borderColor: colors.border,
  },
  strong: {
    colors: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)'],
    borderColor: 'rgba(255,255,255,0.24)',
  },
  subtle: {
    colors: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'],
    borderColor: 'rgba(255,255,255,0.06)',
  },
  default: {
    colors: ['rgba(0, 0, 0)', 'rgba(0, 0, 0, 0.02)'],
    borderColor: colors.border,
  },
};

export function GlassSurface({
  children,
  variant = 'soft',
  style,
}: PropsWithChildren<GlassSurfaceProps>) {
  const gradient = variantMap[variant];

  return (
    <LinearGradient
      colors={gradient.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { borderColor: gradient.borderColor }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 16,
    overflow: 'hidden',
  },
});
