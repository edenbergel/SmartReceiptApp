import { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

import { colors } from '../theme/colors';

interface ScreenContainerProps {
  withScroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  withScroll,
  contentStyle,
}: PropsWithChildren<ScreenContainerProps>) {
  if (withScroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
});
