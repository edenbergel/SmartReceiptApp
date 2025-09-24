import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, StyleProp, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { radius } from '../theme/metrics';

interface PrimaryButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  style,
  textStyle,
  fullWidth,
}: PropsWithChildren<PrimaryButtonProps>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)'] : [colors.primary, colors.primarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.label, textStyle]}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.2,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    shadowOpacity: 0,
  },
  fullWidth: {
    width: '100%',
  },
});
