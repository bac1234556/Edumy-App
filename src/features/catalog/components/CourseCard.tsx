// src/features/catalog/components/CourseCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../../components/ui/Text';
import { MoneyText } from '../../../components/ui/MoneyText';
import { CourseCard as CourseCardType } from '../api';
import { Ionicons } from '@expo/vector-icons';
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
      activeOpacity={0.82}
      style={[styles.card, microShadow]}
      onPress={handlePress}
    >
      {/* 16:9 Framed Thumbnail */}
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
              <Ionicons name="layers-outline" size={26} color={semantic.brandPrimary} />
            </View>
          </View>
        )}

        {/* Top-left Category Tag */}
        {course.categoryName && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {course.categoryName.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Top-right Free Indicator */}
        {course.isFree && (
          <View style={styles.freeCornerBadge}>
            <Text style={styles.freeCornerText}>MIỄN PHÍ</Text>
          </View>
        )}
      </View>

      {/* Editorial Body */}
      <View style={styles.content}>
        <Text variant="h3" numberOfLines={2} style={styles.title}>
          {course.title}
        </Text>

        {course.instructorName && (
          <View style={styles.instructorRow}>
            <Ionicons name="person-outline" size={13} color={semantic.textMuted} />
            <Text variant="bodySmall" numberOfLines={1} style={styles.instructor}>
              {course.instructorName}
            </Text>
          </View>
        )}

        {/* Tabular Footer: Rating on left, Price on right */}
        <View style={styles.footer}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#D97706" />
            <Text style={styles.ratingScore}>
              {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.ratingCount}>
              ({course.ratingCount || 0})
            </Text>
          </View>

          <MoneyText
            amount={course.isFree ? 0 : course.price}
            style={styles.priceText}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    overflow: 'hidden',
    marginBottom: 14,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#F1F5F9',
    position: 'relative',
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
    backgroundColor: semantic.surfaceSubtle,
  },
  placeholderIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  freeCornerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: semantic.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeCornerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  content: {
    padding: 14,
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
    marginTop: 7,
  },
  instructor: {
    color: semantic.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    fontVariant: ['tabular-nums'],
  },
  ratingCount: {
    fontSize: 11,
    color: '#B45309',
    fontVariant: ['tabular-nums'],
  },
  priceText: {
    fontSize: 15,
  },
});
