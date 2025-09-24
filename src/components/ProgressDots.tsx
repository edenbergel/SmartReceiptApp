import { View, StyleSheet } from 'react-native';

import { colors } from '../theme/colors';

interface ProgressDotsProps {
  activeIndex: number;
  total?: number;
}

export function ProgressDots({ activeIndex, total = 3 }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index <= activeIndex;
        return <View key={index} style={[styles.dot, isActive ? styles.active : styles.inactive]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 32,
    height: 6,
    borderRadius: 8,
  },
  active: {
    backgroundColor: colors.primary,
  },
  inactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
});
