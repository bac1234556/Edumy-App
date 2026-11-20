// src/features/catalog/components/CourseCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../../components/ui/Text';
import { Badge } from '../../../components/ui/Badge';
import { MoneyText } from '../../../components/ui/MoneyText';
import { CourseCard as CourseCardType } from '../api';
import { semantic, radius, microShadow } from '../../../theme/tokens';

interface CourseCardProps {
  course: CourseCardType;
}

export function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/courses/${course.slug}` as const);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={[styles.card, microShadow]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Xem khóa học ${course.title}`}
    >
      {/* 16:9 Clean Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {course.thumbnailUrl ? (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <View style={styles.placeholderIconBox}>
              <Ionicons name="book-outline" size={24} color={semantic.brandPrimary} />
            </View>
          </View>
        )}
      </View>

      {/* Scannable Card Body */}
      <View style={styles.content}>
        {Boolean(course.categoryName) && (
          <Badge label={course.categoryName!} variant="info" style={styles.categoryBadge} />
        )}

        <Text variant="h3" numberOfLines={2} style={styles.title}>
          {course.title}
        </Text>

        {Boolean(course.instructorName) && (
          <View style={styles.instructorRow}>
            <Ionicons name="person-outline" size={13} color={semantic.textMuted} />
            <Text variant="bodySmall" numberOfLines={1} style={styles.instructor}>
              {course.instructorName}
            </Text>
          </View>
        )}

        {/* Footer: Rating on left, Price or Free Pill on right */}
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={semantic.ratingStar} />
            <Text style={styles.ratingScore}>
              {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.ratingCount}>
              ({course.ratingCount || 0})
            </Text>
          </View>

          {course.isFree ? (
            <Badge label="Miễn phí" variant="info" />
          ) : (
            <MoneyText amount={course.price} style={styles.priceText} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    overflow: 'hidden',
    marginBottom: 14,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: semantic.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.surfaceMuted,
  },
  placeholderIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
  },
  categoryBadge: {
    marginBottom: 8,
  },
  title: {
    lineHeight: 21,
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  instructor: {
    color: semantic.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  ratingCount: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  priceText: {
    fontSize: 15,
    color: semantic.textPrimary,
  },
});
