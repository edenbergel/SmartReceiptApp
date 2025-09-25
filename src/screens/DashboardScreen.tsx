import { ReactNode, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Euro, Filter, LineChart, PieChart, Receipt } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBackground } from '../components/GradientBackground';
import { GlassSurface } from '../components/GlassSurface';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ExpenseCard } from '../components/ExpenseCard';
import { Logo } from '../components/Logo';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { resetScan } from '../store/scanSlice';
import type { RootStackParamList } from '../navigation/types';

const renderSeparator = () => <View style={{ height: 16 }} />;

type Timeframe = {
  id: string;
  label: string;
  days: number | null;
};

const TIMEFRAMES: Timeframe[] = [
  { id: 'all', label: 'Tout', days: null },
  { id: '30d', label: '30 jours', days: 30 },
  { id: '90d', label: '90 jours', days: 90 },
  { id: '365d', label: '12 mois', days: 365 },
];

type DashboardTab = 'expenses' | 'insights';

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: 'expenses', label: 'Dépenses' },
  { id: 'insights', label: 'Analyses' },
];

export function DashboardScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) {
  const expenses = useAppSelector((state) => state.expenses.items);
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<DashboardTab>('expenses');
  const [selectedRange, setSelectedRange] = useState<Timeframe>(TIMEFRAMES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');

  const allCategories = useMemo(() => {
    const unique = new Set(expenses.map((expense) => expense.category));
    return ['Toutes', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const { start, end } = buildRange(selectedRange);

    return expenses.filter((expense) => {
      const matchesCategory =
        selectedCategory === 'Toutes' || expense.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!start || !end) {
        return true;
      }

      const expenseDate = parseExpenseDate(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }, [expenses, selectedCategory, selectedRange]);

  const total = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const trend = useMemo(() => {
    if (!selectedRange.days) {
      return null;
    }

    const { start, end } = buildRange(selectedRange);
    if (!start || !end) {
      return null;
    }

    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - selectedRange.days + 1);

    const previousTotal = expenses
      .filter((expense) => {
        const expenseDate = parseExpenseDate(expense.date);
        return expenseDate >= previousStart && expenseDate <= previousEnd;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (previousTotal === 0) {
      return null;
    }

    const delta = total - previousTotal;
    const percent = (delta / previousTotal) * 100;
    return percent;
  }, [expenses, selectedRange, total]);

  const average = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return 0;
    }
    return total / filteredExpenses.length;
  }, [filteredExpenses.length, total]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((expense) => {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    });

    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const topCategory = entries[0]?.[0];
    return {
      entries,
      topCategory,
    };
  }, [filteredExpenses]);

  const handleScanPress = () => {
    dispatch(resetScan());
    navigation.navigate('Scan');
  };

  const listHeader = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.header}>
        <GlassSurface variant="strong" style={styles.avatarSurface}>
          <Logo size={72} />
        </GlassSurface>
        <View style={styles.headerText}>
          <Text style={styles.title}>SmartReceipt</Text>
          <Text style={styles.subtitle}>Vos reçus simplifiés</Text>
        </View>
      </View>

      <GlassSurface variant="strong" style={styles.totalCard}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.mutedLabel}>Total filtré</Text>
            <View style={styles.totalAmountRow}>
              <Euro size={28} color={colors.primary} />
              <Text style={styles.totalAmount}>{total.toFixed(2)}</Text>
            </View>
            <Text style={styles.secondaryLabel}>
              {selectedRange.label}
              {selectedCategory !== 'Toutes' ? ` · ${selectedCategory}` : ''}
            </Text>
          </View>
          <GlassSurface variant="subtle" style={styles.totalIconSurface}>
            <Receipt size={28} color={colors.textMuted} />
          </GlassSurface>
        </View>
      </GlassSurface>

      <GlassSurface variant="strong" style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Filter size={18} color={colors.textMuted} />
          <Text style={styles.sectionTitle}>Filtres</Text>
        </View>
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {TIMEFRAMES.map((timeframe) => (
              <FilterChip
                key={timeframe.id}
                label={timeframe.label}
                active={selectedRange.id === timeframe.id}
                onPress={() => setSelectedRange(timeframe)}
              />
            ))}
          </ScrollView>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {allCategories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </GlassSurface>

      <View style={styles.tabsRow}>
        {DASHBOARD_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </View>

      {activeTab === 'insights' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricsRow}
            style={styles.metricsScroll}
          >
            <MetricCard
              icon={<Euro size={18} color={colors.primary} />}
              title="Moyenne"
              value={`${average.toFixed(2)} €`}
              subtitle="par reçu"
            />
            <MetricCard
              icon={
                <LineChart
                  size={18}
                  color={(trend ?? 0) >= 0 ? colors.success : colors.warning}
                />
              }
              title="Tendance"
              value={trend == null ? '—' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
              subtitle={trend == null ? 'N/A' : trend >= 0 ? 'En hausse' : 'En baisse'}
            />
            <MetricCard
              icon={<PieChart size={18} color={colors.primarySoft} />}
              title="Catégorie"
              value={categoryBreakdown.topCategory ?? 'Aucune'}
              subtitle="dominante"
            />
          </ScrollView>

          {categoryBreakdown.entries.length > 0 ? (
            <GlassSurface variant="strong" style={styles.breakdownCard}>
              <View style={styles.sectionHeader}>
                <PieChart size={20} color={colors.textMuted} />
                <Text style={styles.sectionTitle}>Répartition catégories</Text>
              </View>
              <View style={styles.breakdownList}>
                {categoryBreakdown.entries.map(([category, amount]) => {
                  const percent = total > 0 ? Math.min((amount / total) * 100, 100) : 0;
                  return (
                    <View key={category} style={styles.breakdownRow}>
                      <View style={styles.breakdownHeader}>
                        <Text style={styles.breakdownCategory}>{category}</Text>
                        <Text style={styles.breakdownValue}>{amount.toFixed(2)} €</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassSurface>
          ) : (
            <GlassSurface variant="soft" style={styles.emptyInsights}>
              <Text style={styles.emptyInsightsTitle}>Pas encore de données</Text>
              <Text style={styles.emptyInsightsSubtitle}>
                Scannez un reçu pour voir vos statistiques.
              </Text>
            </GlassSurface>
          )}
        </>
      )}

      {activeTab === 'expenses' && (
        <View style={styles.sectionHeader}>
          <Receipt size={20} color={colors.textMuted} />
          <Text style={styles.sectionTitle}>Dernières dépenses</Text>
        </View>
      )}
    </View>
  ), [activeTab, average, categoryBreakdown.entries, categoryBreakdown.topCategory, allCategories, selectedCategory, selectedRange, total, trend]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={activeTab === 'expenses' ? filteredExpenses : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
            />
          )}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            activeTab === 'expenses' ? (
              <GlassSurface variant="soft" style={styles.emptyState}>
                <GlassSurface variant="subtle" style={styles.emptyIconSurface}>
                  <Receipt size={48} color={colors.textMuted} />
                </GlassSurface>
                <Text style={styles.emptyTitle}>Aucune dépense ici</Text>
                <Text style={styles.emptySubtitle}>
                  Ajustez vos filtres ou scannez un nouveau reçu.
                </Text>
              </GlassSurface>
            ) : null
          }
        />
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.fabContainer}>
          <FloatingActionButton onPress={handleScanPress}>
            <Camera size={17} color={colors.foreground} />
          </FloatingActionButton>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function buildRange(timeframe: Timeframe) {
  if (!timeframe.days) {
    return { start: null, end: null };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - timeframe.days + 1);

  return { start, end };
}

function parseExpenseDate(dateString: string) {
  if (!dateString) {
    return new Date(0);
  }

  const normalized = dateString.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  const parts = normalized.split(/[\/\.\-]/);
  if (parts.length >= 3) {
    const [day, month, year] = parts;
    const numericYear = year.length === 2 ? Number(`20${year}`) : Number(year);
    const numericMonth = Number(month) - 1;
    const numericDay = Number(day);
    const parsed = new Date(numericYear, numericMonth, numericDay);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : undefined]}
    >
      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>{label}</Text>
    </TouchableOpacity>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tabButton, active ? styles.tabButtonActive : undefined]}
    >
      <Text style={[styles.tabLabel, active ? styles.tabLabelActive : undefined]}>{label}</Text>
    </TouchableOpacity>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

function MetricCard({ icon, title, value, subtitle }: MetricCardProps) {
  return (
    <GlassSurface variant="soft" style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  listHeader: {
    gap: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarSurface: {
    padding: 0,
    borderRadius: 28,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  totalCard: {
    padding: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutedLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  totalAmount: {
    color: colors.foreground,
    fontSize: 32,
    fontWeight: '600',
  },
  secondaryLabel: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
  },
  totalIconSurface: {
    padding: 16,
    borderRadius: 24,
  },
  filterCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.foreground,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    backgroundColor: colors.glass,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.foreground,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
    marginTop: 12,
  },
  emptyIconSurface: {
    padding: 18,
    borderRadius: 28,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  metricsScroll: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
  },
  metricCard: {
    width: 200,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    gap: 4,
  },
  metricTitle: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  metricSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyInsights: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyInsightsTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyInsightsSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  breakdownCard: {
    padding: 20,
    gap: 16,
  },
  breakdownList: {
    gap: 14,
  },
  breakdownRow: {
    gap: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCategory: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '500',
  },
  breakdownValue: {
    color: colors.textMuted,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  bottomSafeArea: {
    backgroundColor: 'transparent',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
});
