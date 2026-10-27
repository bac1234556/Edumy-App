import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * Component Chip danh mục (Category Chip) có trạng thái chọn (selected)
 */
export const CategoryChip = ({ name, isSelected = false, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#2563EB', // Xanh Primary Edumy
    borderColor: '#2563EB',
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
