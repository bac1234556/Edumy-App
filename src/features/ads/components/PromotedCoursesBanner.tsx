// src/features/ads/components/PromotedCoursesBanner.tsx
// Full-width auto-scrolling Promotional Ad Carousel for Edumy Hot / Deal / New Courses.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PromotedCourseBadgeType, PromotedCourseItem } from '../logic';
import { useFlashSaleCountdown } from '../hooks';
import { Text } from '../../../components/ui/Text';
import { MoneyText } from '../../../components/ui/MoneyText';
import { microShadow, primitive, radius, semantic } from '../../../theme/tokens';

const AUTO_SCROLL_INTERVAL_MS = 4000;

interface PromotedCoursesBannerProps {
  items: PromotedCourseItem[];
}

function getRibbonStyle(type: PromotedCourseBadgeType): {
  bg: string;
  text: string;
  icon: 'flame' | 'flash' | 'sparkles';
} {
  switch (type) {
    case 'HOT':
      return { bg: '#DC2626', text: '#FFFFFF', icon: 'flame' };
    case 'VALUE':
      return { bg: '#D97706', text: '#FFFFFF', icon: 'flash' };
    case 'NEW':
      return { bg: '#2563EB', text: '#FFFFFF', icon: 'sparkles' };
  }
}

export function PromotedCoursesBanner({ items }: PromotedCoursesBannerProps) {
  const router = useRouter();
  const countdown = useFlashSaleCountdown();
  const scrollRef = useRef<ScrollView>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const count = items.length;

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, count]);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean = true) => {
      if (count === 0) return;
      const safeIndex = ((index % count) + count) % count;
      setActiveIndex(safeIndex);
      if (slideWidth > 0) {
        scrollRef.current?.scrollTo({
          x: safeIndex * slideWidth,
          y: 0,
          animated,
        });
      }
    },
    [count, slideWidth]
  );

  useEffect(() => {
    if (count <= 1 || slideWidth <= 0 || isDragging) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({
          x: next * slideWidth,
          y: 0,
          animated: true,
        });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [count, slideWidth, isDragging]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measured = Math.floor(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== slideWidth) {
      setSlideWidth(measured);
    }
  };

  const syncIndexFromScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0 || count === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.max(0, Math.min(count - 1, Math.round(offsetX / slideWidth)));
    setActiveIndex(nextIndex);
  };

  if (count === 0) return null;

  return (
    <View style={[styles.wrapper, microShadow]}>
      {/* Campaign Header */}
      <View style={styles.campaignHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.adTag}>
            <Ionicons name="megaphone-outline" size={11} color="#FDE68A" />
            <Text style={styles.adTagText}>AD · TÀI TRỢ</Text>
          </View>
          <Text style={styles.campaignTitle} numberOfLines={1}>
            Săn khóa học hot hôm nay
          </Text>
        </View>

        <View style={styles.countdownChip}>
          <Ionicons name="time-outline" size={12} color="#FDE68A" />
          <Text style={styles.countdownText}>Kết thúc sau {countdown}</Text>
        </View>
      </View>

      {/* Auto-scrolling Full-Width Poster Slider */}
      <View style={styles.sliderViewport} onLayout={handleLayout}>
        {slideWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => setIsDragging(true)}
            onScrollEndDrag={(e) => {
              syncIndexFromScroll(e);
              setIsDragging(false);
            }}
            onMomentumScrollEnd={(e) => {
              syncIndexFromScroll(e);
              setIsDragging(false);
            }}
          >
            {items.map((item) => {
              const { course, type, badgeLabel, highlightNote } = item;
              const ribbon = getRibbonStyle(type);
              const isFree = Boolean(course.isFree) || (course.price ?? 0) <= 0;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.slideCard, { width: slideWidth }]}
                  activeOpacity={0.92}
                  onPress={() => {
                    if (course.slug) {
                      router.push(`/courses/${course.slug}` as const);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quảng cáo khóa học ${course.title}`}
                >
                  <View style={styles.posterMedia}>
                    {course.thumbnailUrl ? (
                      <Image
                        source={{ uri: course.thumbnailUrl }}
                        style={styles.posterImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.posterPlaceholder}>
                        <Ionicons name="school-outline" size={40} color="#93C5FD" />
                      </View>
                    )}

                    <View style={styles.mediaScrim} />

                    {/* Top-left Campaign Ribbon */}
                    <View style={[styles.ribbonBadge, { backgroundColor: ribbon.bg }]}>
                      <Ionicons name={ribbon.icon} size={11} color={ribbon.text} />
                      <Text style={[styles.ribbonText, { color: ribbon.text }]}>{badgeLabel}</Text>
                    </View>

                    {/* Top-right Ad Disclosure Tag */}
                    <View style={styles.sponsoredPill}>
                      <Text style={styles.sponsoredPillText}>Quảng cáo</Text>
                    </View>
                  </View>

                  <View style={styles.posterBody}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.instructorText} numberOfLines={1}>
                        {course.instructorName || 'Giảng viên Edumy'}
                      </Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.highlightText} numberOfLines={1}>
                        {highlightNote}
                      </Text>
                    </View>

                    <View style={styles.ctaFooter}>
                      <View>
                        <Text style={styles.priceCaption}>Học phí ưu đãi</Text>
                        <MoneyText amount={isFree ? 0 : (course.price ?? 0)} style={styles.priceText} />
                      </View>

                      <View style={styles.ctaPill}>
                        <Text style={styles.ctaPillText}>Xem ưu đãi ngay</Text>
                        <Ionicons name="arrow-forward" size={14} color="#0F172A" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Bottom Controls: Arrows + Interactive Pagination Dots */}
      {count > 1 && (
        <View style={styles.controlsBar}>
          <TouchableOpacity
            style={styles.navCircle}
            onPress={() => scrollToIndex(activeIndex - 1)}
            accessibilityRole="button"
            accessibilityLabel="Khóa học quảng cáo trước"
          >
            <Ionicons name="chevron-back" size={15} color="#E2E8F0" />
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {items.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={item.course.id ?? idx}
                  onPress={() => scrollToIndex(idx)}
                  style={styles.dotHitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`Chuyển đến quảng cáo ${idx + 1}`}
                >
                  <View style={[styles.dot, active && styles.dotActive]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.controlsRight}>
            <Text style={styles.slideCounter}>
              {activeIndex + 1}/{count}
            </Text>
            <TouchableOpacity
              style={styles.navCircle}
              onPress={() => scrollToIndex(activeIndex + 1)}
              accessibilityRole="button"
              accessibilityLabel="Khóa học quảng cáo tiếp theo"
            >
              <Ionicons name="chevron-forward" size={15} color="#E2E8F0" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderRadius: radius.card,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    overflow: 'hidden',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  adTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.4,
  },
  campaignTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: primitive.white,
    flexShrink: 1,
  },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
    fontVariant: ['tabular-nums'],
  },
  sliderViewport: {
    width: '100%',
  },
  slideCard: {
    backgroundColor: '#0F172A',
  },
  posterMedia: {
    width: '100%',
    height: 168,
    backgroundColor: '#1E3A8A',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  ribbonBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ribbonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sponsoredPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  posterBody: {
    padding: 14,
    gap: 6,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: primitive.white,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructorText: {
    fontSize: 12,
    color: '#CBD5E1',
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 12,
    color: '#64748B',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCD34D',
    flexShrink: 1,
  },
  ctaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 10,
  },
  priceCaption: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FDE68A',
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  ctaPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotHitSlop: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  dotActive: {
    width: 20,
    backgroundColor: semantic.ratingStar,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
});
