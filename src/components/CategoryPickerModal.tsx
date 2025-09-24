import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { GlassSurface } from './GlassSurface';

interface CategoryPickerModalProps {
  visible: boolean;
  categories: string[];
  selected?: string;
  onSelect: (category: string) => void;
  onClose: () => void;
}

export const CategoryPickerModal = memo(
  ({ visible, categories, selected, onSelect, onClose }: CategoryPickerModalProps) => {
    return (
      <Modal backdropColor="rgba(0,0,0,0.6)" visible={visible} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.content} onPress={(event) => event.stopPropagation()}>
            <GlassSurface variant="strong" style={styles.glassContent}>
              <Text style={styles.title}>Sélectionner une catégorie</Text>
              <View style={styles.list}>
                {categories.map((category) => {
                  const isActive = category === selected;
                  return (
                    <Pressable
                      key={category}
                      style={[styles.item, isActive && styles.activeItem]}
                      onPress={() => onSelect(category)}
                    >
                      <Text style={[styles.itemLabel, isActive && styles.activeLabel]}>{category}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
  },
  glassContent: {
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  list: {
    gap: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  activeItem: {
    backgroundColor: colors.primary,
  },
  itemLabel: {
    color: colors.foreground,
    fontSize: 16,
  },
  activeLabel: {
    color: colors.foreground,
    fontWeight: '600',
  },
});
