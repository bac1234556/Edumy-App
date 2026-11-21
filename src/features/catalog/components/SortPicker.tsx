// src/features/catalog/components/SortPicker.tsx
// Direct sort option selector with bottom sheet modal (Android, iOS & Web).

import React, { useContext, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui/Text';
import { microShadow, radius, semantic, space } from '../../../theme/tokens';
import {
  CATALOG_SORT_OPTIONS,
  CatalogSortOption,
  getSortLabel,
} from '../logic';

export interface SortPickerProps {
  value: CatalogSortOption;
  onChange: (value: CatalogSortOption) => void;
}

export function SortPicker({ value, onChange }: SortPickerProps) {
  const [visible, setVisible] = useState(false);
  const insets = useContext(SafeAreaInsetsContext);
  const bottomPadding = Math.max(insets?.bottom ?? 0, space[4]);

  const currentLabel = getSortLabel(value);

  const handleOpen = () => {
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleSelect = (nextValue: CatalogSortOption) => {
    onChange(nextValue);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Sắp xếp khóa học, đang chọn ${currentLabel}`}
        accessibilityState={{ expanded: visible }}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={15}
          color={semantic.brandPrimary}
        />
        <Text style={styles.triggerText} numberOfLines={1}>
          {currentLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={semantic.textMuted}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng hộp chọn sắp xếp"
            testID="sort-picker-backdrop"
          />

          <View
            style={[
              styles.sheet,
              microShadow,
              { paddingBottom: bottomPadding },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text variant="h3" style={styles.title}>
                Sắp xếp theo
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <Ionicons name="close" size={20} color={semantic.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionList} accessibilityRole="radiogroup">
              {CATALOG_SORT_OPTIONS.map((option) => {
                const selected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      variant="body"
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={semantic.brandPrimary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minHeight: 44,
    maxWidth: '52%',
    borderRadius: radius.btn,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    backgroundColor: semantic.surfaceCard,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
    flexShrink: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: semantic.surfacePage,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: semantic.borderSubtle,
    paddingTop: space[2],
    paddingHorizontal: space[4],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: semantic.borderStrong,
    alignSelf: 'center',
    marginBottom: space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space[2],
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    marginBottom: space[2],
  },
  title: {
    color: semantic.textPrimary,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space[2],
  },
  optionList: {
    gap: space[1],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    borderRadius: radius.btn,
  },
  optionRowSelected: {
    backgroundColor: semantic.brandSoft,
  },
  optionText: {
    color: semantic.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: semantic.brandPrimary,
    fontWeight: '700',
  },
});
