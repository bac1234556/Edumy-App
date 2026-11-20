// src/features/ads/components/InlineCourseAdCard.tsx
// Native In-Feed Sponsored Ad card inserted cleanly between catalog courses.

import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PromotedCourseBadgeType, PromotedCourseItem } from '../logic';
import { Text } from '../../../components/ui/Text';
import { MoneyText } from '../../../components/ui/MoneyText';
import { microShadow, primitive, radius, semantic } from '../../../theme/tokens';

interface InlineCourseAdCardProps {
  item: PromotedCourseItem;
}

function getAccentColor(type: PromotedCourseBadgeType): string {
  switch (type) {
    case 'HOT':
      return '#DC2626';
    case 'VALUE':
      return '#D97706';
    case 'NEW':
      return '#2563EB';
  }
}

export function InlineCourseAdCard({ item }: InlineCourseAdCardProps) {
  const router = useRouter();
  const { course, type, badgeLabel, highlightNote } = item;
  const accent = getAccentColor(type);
  const isFree = Boolean(course.isFree) || (course.price ?? 0) <= 0;

  return (
    <TouchableOpacity
      style={[styles.card, microShadow]}
      activeOpacity={0.88}
      onPress={() => {
        if (course.slug) {
          router.push(`/courses/${course.slug}` as const);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Quảng cáo được tài trợ: ${course.title}`}
    >
      {/* Top Sponsored Strip */}
      <View style={styles.topStrip}>
        <View style={styles.sponsoredBadge}>
          <Ionicons name="megaphone-outline" size={11} color="#FDE68A" />
          <Text style={styles.sponsoredText}>Được tài trợ · AD</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: accent }]}>
          <Text style={styles.typeText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Horizontal Ad Content */}
      <View style={styles.bodyRow}>
        <View style={styles.thumbWrap}>
          {course.thumbnailUrl ? (
            <Image
              source={{ uri: course.thumbnailUrl }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="school-outline" size={26} color={semantic.brandPrimary} />
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={2}>
            {course.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {course.instructorName || 'Giảng viên Edumy'} · {highlightNote}
          </Text>

          <View style={styles.bottomRow}>
            <MoneyText amount={isFree ? 0 : (course.price ?? 0)} style={styles.price} />
            <View style={styles.ctaChip}>
              <Text style={styles.ctaText}>Khám phá ngay</Text>
              <Ionicons name="arrow-forward" size={12} color={primitive.white} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: semantic.brandSoft,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: semantic.brandPrimary,
    marginBottom: 14,
    overflow: 'hidden',
  },
  topStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#0F172A',
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '800',
    color: primitive.white,
    letterSpacing: 0.4,
  },
  bodyRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.btn,
    overflow: 'hidden',
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: semantic.textPrimary,
    lineHeight: 19,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: semantic.brandPrimaryStrong,
  },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: semantic.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: primitive.white,
  },
});
