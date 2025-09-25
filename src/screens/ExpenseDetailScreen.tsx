import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Building2, Calendar as CalendarIcon, Euro, Tag } from 'lucide-react-native';

import { GradientBackground } from '../components/GradientBackground';
import { GlassSurface } from '../components/GlassSurface';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../hooks/useRedux';

export type ExpenseDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ExpenseDetail'>;

export function ExpenseDetailScreen({ navigation, route }: ExpenseDetailScreenProps) {
  const { expenseId } = route.params;
  const expense = useAppSelector((state) =>
    state.expenses.items.find((item) => item.id === expenseId),
  );

  const lineItems = expense?.lineItems ?? [];

  const fallback = useMemo(
    () => ({
      title: "Reçu introuvable",
      subtitle: "Ce reçu n'existe plus ou a été supprimé.",
    }),
    [],
  );

  const formattedAmount = useMemo(() => {
    if (!expense) {
      return '0.00';
    }
    return expense.amount.toFixed(2);
  }, [expense]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNewScan = () => {
    navigation.navigate('Scan');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <IconButton onPress={handleBack}>
                <ArrowLeft size={20} color={colors.textMuted} />
              </IconButton>
              <Text style={styles.headerTitle}>Détail du reçu</Text>
              <View style={{ width: 44 }} />
            </View>

            <GlassSurface variant="strong" style={styles.amountCard}>
              <View style={styles.amountIcon}>
                <Euro size={20} color={colors.primary} />
              </View>
              <Text style={styles.amountValue}>{formattedAmount} €</Text>
              <Text style={styles.amountLabel}>Montant TTC</Text>
            </GlassSurface>

            <GlassSurface variant="strong" style={styles.infoCard}>
              <DetailRow
                icon={<Building2 size={18} color={colors.primary} />}
                label="Commerçant"
                value={expense?.merchant ?? fallback.title}
              />
              <DetailRow
                icon={<CalendarIcon size={18} color={colors.primary} />}
                label="Date"
                value={expense?.date ?? fallback.subtitle}
              />
              <DetailRow
                icon={<Tag size={18} color={colors.primary} />}
                label="Catégorie"
                value={expense?.category ?? '—'}
              />
            </GlassSurface>

            {lineItems.length > 0 && (
              <GlassSurface variant="strong" style={styles.lineItemsCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Détails des achats</Text>
                  <Text style={styles.sectionSubtitle}>{lineItems.length} article(s)</Text>
                </View>
                <View style={styles.lineItemsList}>
                  {lineItems.map((item, index) => (
                    <LineItemRow key={`${item.description}-${index}`} item={item} />
                  ))}
                </View>
              </GlassSurface>
            )}

            <GlassSurface variant="soft" style={styles.notesCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>
                {expense
                  ? "Ajoutez bientôt des commentaires, pièces jointes ou justificatifs pour enrichir ce reçu."
                  : "Aucune donnée disponible pour ce reçu."}
              </Text>
            </GlassSurface>
          </View>
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.actionsRow}>
          <PrimaryButton onPress={handleNewScan} style={styles.actionButton} fullWidth>
            Scanner un reçu
          </PrimaryButton>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

interface LineItemRowProps {
  item: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  };
}

function LineItemRow({ item }: LineItemRowProps) {
  const quantity = item.quantity;
  const unitPrice = item.unitPrice ?? null;
  const total = item.total ?? (unitPrice != null ? unitPrice * (quantity ?? 1) : null);

  const metaParts: string[] = [];
  if (quantity != null) {
    metaParts.push(`${quantity} ×`);
  }
  if (unitPrice != null) {
    metaParts.push(`${unitPrice.toFixed(2)} €`);
  }
  const metaText = metaParts.length > 0 ? metaParts.join(' ') : '—';

  return (
    <View style={styles.lineItemRow}>
      <View style={styles.lineItemText}>
        <Text style={styles.lineItemTitle}>{item.description}</Text>
        <Text style={styles.lineItemMeta}>{metaText}</Text>
      </View>
      <Text style={styles.lineItemAmount}>{total != null ? `${total.toFixed(2)} €` : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  container: {
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600',
  },
  amountCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 28,
  },
  amountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountValue: {
    color: colors.foreground,
    fontSize: 40,
    fontWeight: '700',
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoCard: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  notesCard: {
    gap: 12,
  },
  lineItemsCard: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  lineItemsList: {
    gap: 16,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  lineItemText: {
    flex: 1,
    gap: 4,
  },
  lineItemTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  lineItemMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  lineItemAmount: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  notesText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  bottomSafeArea: {
    backgroundColor: 'transparent',
  },
});
