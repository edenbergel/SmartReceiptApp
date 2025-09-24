import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

interface FloatingActionButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function FloatingActionButton({ children, onPress, style }: PropsWithChildren<FloatingActionButtonProps>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed, style]}
    >
      <LinearGradient
        colors={[colors.primary, colors.primarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {children}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
