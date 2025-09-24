import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { radius } from '../theme/metrics';
import { colors } from '../theme/colors';

interface IconButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ children, onPress, style }: PropsWithChildren<IconButtonProps>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
