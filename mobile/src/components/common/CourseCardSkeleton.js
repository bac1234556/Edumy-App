import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Component Skeleton loading placeholder cho thẻ khóa học (CourseCard)
 * Hỗ trợ 2 layout tương ứng với CourseCard: 'horizontal' và 'vertical'
 */
export const CourseCardSkeleton = ({ layout = 'vertical' }) => {
  const isHoriz = layout === 'horizontal';

  return (
    <View style={[styles.card, isHoriz ? styles.cardHorizontal : styles.cardVertical]} testID="course-card-skeleton">
      <View style={[styles.imageSkeleton, isHoriz ? styles.imageHoriz : styles.imageVert]} />
      <View style={styles.infoContainer}>
        <View style={styles.categorySkeleton} />
        <View style={styles.titleSkeleton1} />
        <View style={styles.titleSkeleton2} />
        <View style={styles.metaRow}>
          <View style={styles.ratingSkeleton} />
          <View style={styles.priceSkeleton} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHorizontal: {
    width: 260,
    marginRight: 16,
  },
  cardVertical: {
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
  },
  imageSkeleton: {
    backgroundColor: '#E2E8F0',
  },
  imageHoriz: {
    width: '100%',
    height: 140,
  },
  imageVert: {
    width: 120,
    height: 120,
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  categorySkeleton: {
    width: 70,
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  titleSkeleton1: {
    width: '90%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 6,
  },
  titleSkeleton2: {
    width: '65%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingSkeleton: {
    width: 80,
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  priceSkeleton: {
    width: 60,
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
});
