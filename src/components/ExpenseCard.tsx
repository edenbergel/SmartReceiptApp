import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Euro, Receipt } from 'lucide-react-native';

import { GlassSurface } from './GlassSurface';
import { colors } from '../theme/colors';

export interface ExpenseItem {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

interface ExpenseCardProps {
  expense: ExpenseItem;
  onPress?: () => void;
}

export const ExpenseCard = memo(({ expense, onPress }: ExpenseCardProps) => {
  const content = (
    <GlassSurface variant="strong" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.merchant}>{expense.merchant}</Text>
            <View style={styles.badge}>
              <Receipt size={14} color={colors.primary} />
              <Text style={styles.badgeText}>{expense.category}</Text>
            </View>
          </View>
          <Text style={styles.date}>{expense.date}</Text>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.amountRow}>
            <Euro size={18} color={colors.primary} />
            <Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </GlassSurface>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
  },
  pressablePressed: {
    opacity: 0.9,
  },
  card: {
    padding: 20,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  leftColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  merchant: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  date: {
    color: colors.textMuted,
    fontSize: 14,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600',
  },
});
