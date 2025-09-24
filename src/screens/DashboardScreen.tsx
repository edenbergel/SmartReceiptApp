import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Euro, Receipt } from 'lucide-react-native';
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

export function DashboardScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) {
  const expenses = useAppSelector((state) => state.expenses.items);
  const dispatch = useAppDispatch();

  const total = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const handleScanPress = () => {
    dispatch(resetScan());
    navigation.navigate('Scan');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
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
                <Text style={styles.mutedLabel}>Total dépenses</Text>
                <View style={styles.totalAmountRow}>
                  <Euro size={28} color={colors.primary} />
                  <Text style={styles.totalAmount}>{total.toFixed(2)}</Text>
                </View>
              </View>
              <GlassSurface variant="subtle" style={styles.totalIconSurface}>
                <Receipt size={28} color={colors.textMuted} />
              </GlassSurface>
            </View>
          </GlassSurface>

          <View style={styles.sectionHeader}>
            <Receipt size={20} color={colors.textMuted} />
            <Text style={styles.sectionTitle}>Dernières dépenses</Text>
          </View>

          {expenses.length === 0 ? (
            <GlassSurface variant="soft" style={styles.emptyState}>
              <GlassSurface variant="subtle" style={styles.emptyIconSurface}>
                <Receipt size={48} color={colors.textMuted} />
              </GlassSurface>
              <Text style={styles.emptyTitle}>Aucune dépense enregistrée</Text>
              <Text style={styles.emptySubtitle}>
                Appuyez sur le bouton caméra pour commencer
              </Text>
            </GlassSurface>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ExpenseCard expense={item} />}
              ItemSeparatorComponent={renderSeparator}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
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
  totalIconSurface: {
    padding: 16,
    borderRadius: 24,
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
  listContent: {
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
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
  bottomSafeArea: {
    backgroundColor: 'transparent',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
});
