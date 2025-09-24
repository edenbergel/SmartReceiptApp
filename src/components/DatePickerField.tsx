import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { GlassSurface } from './GlassSurface';
import { colors } from '../theme/colors';

interface DatePickerFieldProps {
  value: Date;
  onChange: (next: Date) => void;
}

export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [visible, setVisible] = useState(false);

  const formatted = value.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <>
      <Pressable style={styles.field} onPress={() => setVisible(true)}>
        <Text style={styles.value}>{formatted}</Text>
      </Pressable>
      <Modal
       //transparent
        backdropColor="rgba(0,0,0,0.6)"
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <GlassSurface variant="strong" style={styles.glassContent}>
              <Text style={styles.dialogTitle}>Sélectionner une date</Text>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={value}
                onChange={(_event, nextDate) => {
                  if (nextDate) {
                    onChange(nextDate);
                  }
                }}
                locale="fr-FR"
                themeVariant="dark"
                style={styles.picker}
              />
              <Pressable style={styles.closeButton} onPress={() => setVisible(false)}>
                <Text style={styles.closeLabel}>Fermer</Text>
              </Pressable>
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: {
    color: colors.foreground,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
  },
  glassContent: {
    gap: 16,
    padding: 24,
  },
  dialogTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  picker: {
    backgroundColor: 'transparent',
  },
  closeButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
