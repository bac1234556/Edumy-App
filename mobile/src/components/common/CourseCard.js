import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { RatingStars } from './RatingStars';
import { PriceTag } from './PriceTag';

/**
 * Component thẻ khóa học dùng chung (Course Card)
 * Hỗ trợ 2 chế độ hiển thị:
 * - 'horizontal' (cho slider danh sách nổi bật)
 * - 'vertical' (cho danh sách dọc thông thường)
 */
export const CourseCard = ({
  course,
  layout = 'horizontal',
  onPress,
  onWishlistToggle,
  isWishlistedInitially = false,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitially);

  const handleWishlistPress = (e) => {
    e?.stopPropagation?.();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    if (onWishlistToggle) {
      onWishlistToggle(course.id, nextState);
    }
  };

  const isHoriz = layout === 'horizontal';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, isHoriz ? styles.cardHorizontal : styles.cardVertical]}
      onPress={() => onPress && onPress(course)}
    >
      {/* Thumbnail + Wishlist Button */}
      <View style={isHoriz ? styles.imageWrapperHoriz : styles.imageWrapperVert}>
        <Image
          source={{ uri: course.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
        >
          <Text style={[styles.heartIcon, isWishlisted && styles.heartIconActive]}>
            {isWishlisted ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        {course.level && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        {course.categoryName && (
          <Text style={styles.categoryName} numberOfLines={1}>
            {course.categoryName}
          </Text>
        )}

        <Text
          style={[styles.title, isHoriz ? styles.titleHoriz : styles.titleVert]}
          numberOfLines={2}
        >
          {course.title}
        </Text>

        <Text style={styles.instructorName} numberOfLines={1}>
          {course.instructor?.fullName || course.instructorName || 'Giảng viên Edumy'}
        </Text>

        <View style={styles.ratingRow}>
          <RatingStars
            rating={course.averageRating || 5.0}
            totalReviews={course.totalReviews || 0}
          />
        </View>

        <View style={styles.priceRow}>
          <PriceTag price={course.price} originalPrice={course.originalPrice} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
  imageWrapperHoriz: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  imageWrapperVert: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CBD5E1',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  heartIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  heartIconActive: {
    color: '#EF4444',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  titleHoriz: {
    fontSize: 14,
    minHeight: 36,
  },
  titleVert: {
    fontSize: 13,
  },
  instructorName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  ratingRow: {
    marginTop: 6,
  },
  priceRow: {
    marginTop: 8,
  },
});
