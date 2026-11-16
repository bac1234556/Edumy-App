import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Component hiển thị nhãn giá tiền (Price Tag), hỗ trợ miễn phí 0đ và giá gốc gạch ngang
 */
export const PriceTag = ({ price = 0, originalPrice, size = 'medium' }) => {
  const isFree = Number(price) === 0;

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount).replace('₫', '₫');
  };

  const isLarge = size === 'large';

  if (isFree) {
    return (
      <View style={styles.container}>
        <View style={styles.freeBadge}>
          <Text style={[styles.freeText, isLarge && styles.freeTextLarge]}>Miễn phí</Text>
        </View>
        {originalPrice && originalPrice > 0 && (
          <Text style={styles.originalPriceText}>{formatVND(originalPrice)}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.priceText, isLarge && styles.priceTextLarge]}>
        {formatVND(price)}
      </Text>
      {originalPrice && originalPrice > price && (
        <Text style={styles.originalPriceText}>{formatVND(originalPrice)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    color: '#059669', // Xanh lục đậm hiện đại
    fontWeight: '800',
    fontSize: 15,
  },
  priceTextLarge: {
    fontSize: 22,
  },
  originalPriceText: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  freeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  freeText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  freeTextLarge: {
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
