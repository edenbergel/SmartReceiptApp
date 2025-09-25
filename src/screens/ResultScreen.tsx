import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Check,
  Euro,
  Tag,
} from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { GradientBackground } from "../components/GradientBackground";
import { GlassSurface } from "../components/GlassSurface";
import { IconButton } from "../components/IconButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProgressDots } from "../components/ProgressDots";
import { SecondaryButton } from "../components/SecondaryButton";
import { TextField } from "../components/TextField";
import { DatePickerField } from "../components/DatePickerField";
import { CategoryPickerModal } from "../components/CategoryPickerModal";
import { colors } from "../theme/colors";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { addExpense } from "../store/expensesSlice";
import { resetScan } from "../store/scanSlice";
import type { RootStackParamList } from "../navigation/types";

const categories = [
  "Food",
  "Transport",
  "Office",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Travel",
  "Other",
];

function parseDate(input: string | undefined) {
  if (!input) return new Date();
  if (input.includes("-")) {
    return new Date(input);
  }
  if (input.includes("/")) {
    const [day, month, year] = input.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatToFrench(date: Date) {
  return date.toLocaleDateString("fr-FR");
}

export function ResultScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Result">) {
  const dispatch = useAppDispatch();
  const { extractedData } = useAppSelector((state) => state.scan);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDate(extractedData?.date)
  );
  const [merchant, setMerchant] = useState(extractedData?.merchant ?? "");
  const [amount, setAmount] = useState(() =>
    extractedData?.amount ? extractedData.amount.toString() : ""
  );
  const [category, setCategory] = useState(
    extractedData?.category ?? categories[0]
  );

  useEffect(() => {
    if (!extractedData) {
      return;
    }

    setSelectedDate(parseDate(extractedData.date));
    setMerchant(extractedData.merchant ?? "");
    setAmount(
      typeof extractedData.amount === "number" && !Number.isNaN(extractedData.amount)
        ? extractedData.amount.toString()
        : ""
    );
    setCategory(extractedData.category ?? categories[0]);
  }, [extractedData]);

  useEffect(() => {
    if (!extractedData) {
      navigation.replace("Dashboard");
    }
  }, [extractedData, navigation]);

  const isValid = useMemo(() => {
    return (
      merchant.trim().length > 0 &&
      amount.trim().length > 0 &&
      Number(amount) > 0
    );
  }, [amount, merchant]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (!isValid) {
      return;
    }

    dispatch(
      addExpense({
        id: Date.now().toString(),
        merchant: merchant.trim(),
        amount: Number(amount),
        category,
        date: formatToFrench(selectedDate),
      })
    );

    dispatch(resetScan());
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  if (!extractedData) {
    return null;
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressContainer}>
              <ProgressDots activeIndex={2} />
            </View>

            <View style={styles.header}>
              <IconButton onPress={handleBack}>
                <ArrowLeft size={20} color={colors.textMuted} />
              </IconButton>
              <Text style={styles.title}>Vérifier les détails</Text>
              <View style={{ width: 44 }} />
            </View>

            <GlassSurface variant="strong" style={styles.successCard}>
              <View style={styles.successIcon}>
                <Check size={20} color={colors.success} />
              </View>
              <Text style={styles.successText}>
                Détails extraits avec succès !
              </Text>
            </GlassSurface>

            <GlassSurface variant="strong" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPill}>
                  <CalendarIcon size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Date</Text>
              </View>
              <DatePickerField
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </GlassSurface>

            <GlassSurface variant="strong" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPill}>
                  <Building2 size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Commerçant</Text>
              </View>
              <TextField
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Nom du commerçant"
                editable={true}
              />
            </GlassSurface>

            <GlassSurface variant="strong" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPill}>
                  <Euro size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Montant</Text>
              </View>
              <TextField
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                inputMode="decimal"
              />
            </GlassSurface>

            <GlassSurface variant="strong" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPill}>
                  <Tag size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Catégorie</Text>
              </View>
              <SecondaryButton
                onPress={() => setCategoryModalVisible(true)}
                style={styles.categoryButton}
              >
                {category}
              </SecondaryButton>
            </GlassSurface>

            <View style={styles.actions}>
              <SecondaryButton
                onPress={() =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Dashboard" }],
                  })
                }
                style={styles.secondaryAction}
              >
                Annuler
              </SecondaryButton>
              <PrimaryButton
                onPress={handleSave}
                disabled={!isValid}
                style={styles.primaryAction}
              >
                Enregistrer la dépense
              </PrimaryButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CategoryPickerModal
        visible={categoryModalVisible}
        categories={categories}
        selected={category}
        onSelect={(value) => {
          setCategory(value);
          setCategoryModalVisible(false);
        }}
        onClose={() => setCategoryModalVisible(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  progressContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "600",
  },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "500",
  },
  sectionCard: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  categoryButton: {
    paddingVertical: 14,
  },
  actions: {
    flexDirection: "column",
    gap: 12,
    paddingBottom: 40,
  },
  secondaryAction: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  primaryAction: {
    shadowOpacity: 0.25,
  },
});
