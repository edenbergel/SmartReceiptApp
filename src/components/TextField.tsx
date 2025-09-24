import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { colors } from '../theme/colors';

export const TextField = forwardRef<TextInput, TextInputProps>(function TextField({ style, ...rest }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.foreground,
    fontSize: 16,
  },
});
