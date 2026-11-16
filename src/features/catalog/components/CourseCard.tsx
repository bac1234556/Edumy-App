// src/features/catalog/components/CourseCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../../components/ui/Text';
import { MoneyText } from '../../../components/ui/MoneyText';
import { CourseCard as CourseCardType } from '../api';
import { Ionicons } from '@expo/vector-icons';

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
      activeOpacity={0.85}
      style={styles.card}
      onPress={handlePress}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {course.thumbnailUrl ? (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="school-outline" size={36} color="#0D9488" />
          </View>
        )}
        {course.categoryName && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {course.categoryName.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text variant="h3" numberOfLines={2} style={styles.title}>
          {course.title}
        </Text>

        {course.instructorName && (
          <Text variant="bodySmall" numberOfLines={1} style={styles.instructor}>
            Giảng viên: {course.instructorName}
          </Text>
        )}

        {/* Rating and Reviews */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingScore}>
            {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
          </Text>
          <Text style={styles.ratingCount}>
            ({course.ratingCount || 0})
          </Text>
        </View>

        {/* Price */}
        <View style={styles.footer}>
          <MoneyText amount={course.isFree ? 0 : course.price} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#F1F5F9',
    position: 'relative',
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
    backgroundColor: '#F0FDFA',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    padding: 14,
  },
  title: {
    lineHeight: 22,
    fontSize: 16,
  },
  instructor: {
    marginTop: 6,
    color: '#64748B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  ratingCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
