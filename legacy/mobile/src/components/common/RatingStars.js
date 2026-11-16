import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Component hiển thị đánh giá số sao (Rating Stars) và số lượt nhận xét
 */
export const RatingStars = ({ rating = 0, totalReviews, size = 13, showReviewsCount = true }) => {
  const formattedRating = Number(rating).toFixed(1);

  return (
    <View style={styles.container}>
      <Text style={[styles.starIcon, { fontSize: size }]}>★</Text>
      <Text style={[styles.ratingText, { fontSize: size }]}>{formattedRating}</Text>
      {showReviewsCount && totalReviews != null && (
        <Text style={[styles.reviewsCount, { fontSize: size - 1 }]}>({totalReviews})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    color: '#F59E0B', // Hổ phách / Vàng sao
    fontWeight: 'bold',
  },
  ratingText: {
    color: '#B45309',
    fontWeight: '700',
  },
  reviewsCount: {
    color: '#64748B',
    fontWeight: '400',
  },
});
