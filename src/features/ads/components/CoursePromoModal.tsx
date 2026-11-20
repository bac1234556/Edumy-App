// src/features/ads/components/CoursePromoModal.tsx
// Once-per-session Ad Spotlight Carousel Modal showcasing 2–3 top Edumy courses.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Modal,
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
import { Button } from '../../../components/ui/Button';
import { MoneyText } from '../../../components/ui/MoneyText';
import { primitive, radius, semantic } from '../../../theme/tokens';

const MODAL_AUTO_SCROLL_MS = 5000;

let hasShownPromoModalInSession = false;

interface CoursePromoModalProps {
  items: PromotedCourseItem[];
}

function getModalRibbon(type: PromotedCourseBadgeType): {
  bg: string;
  icon: 'flame' | 'flash' | 'sparkles';
} {
  switch (type) {
    case 'HOT':
      return { bg: '#DC2626', icon: 'flame' };
    case 'VALUE':
      return { bg: '#D97706', icon: 'flash' };
    case 'NEW':
      return { bg: '#2563EB', icon: 'sparkles' };
  }
}

export function CoursePromoModal({ items }: CoursePromoModalProps) {
  const router = useRouter();
  const countdown = useFlashSaleCountdown();
  const scrollRef = useRef<ScrollView>(null);

  const [visible, setVisible] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const count = items.length;

  useEffect(() => {
    if (count === 0 || hasShownPromoModalInSession) return;
    hasShownPromoModalInSession = true;
    setVisible(true);
  }, [count]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (count === 0) return;
      const safeIndex = ((index % count) + count) % count;
      setActiveIndex(safeIndex);
      if (slideWidth > 0) {
        scrollRef.current?.scrollTo({
          x: safeIndex * slideWidth,
          y: 0,
          animated: true,
        });
      }
    },
    [count, slideWidth]
  );

  useEffect(() => {
    if (!visible || count <= 1 || slideWidth <= 0 || isDragging) return;
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
    }, MODAL_AUTO_SCROLL_MS);

    return () => clearInterval(timer);
  }, [visible, count, slideWidth, isDragging]);

  if (count === 0 || !visible) return null;

  const activeItem = items[activeIndex] ?? items[0];

  const handleClose = () => {
    setVisible(false);
  };

  const handleViewCourse = (slug?: string) => {
    setVisible(false);
    if (slug) {
      router.push(`/courses/${slug}` as const);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const measured = Math.floor(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== slideWidth) {
      setSlideWidth(measured);
    }
  };

  const syncFromScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0 || count === 0) return;
    const nextIdx = Math.max(
      0,
      Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.x / slideWidth))
    );
    setActiveIndex(nextIdx);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Ad Disclosure Header */}
          <View style={styles.topBar}>
            <View style={styles.adBadge}>
              <Ionicons name="megaphone-outline" size={12} color="#FDE68A" />
              <Text style={styles.adBadgeText}>QUẢNG CÁO · ƯU ĐÃI EDUMY</Text>
            </View>

            <View style={styles.topRight}>
              {count > 1 && (
                <Text style={styles.counterText}>
                  {activeIndex + 1}/{count}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng quảng cáo khóa học"
              >
                <Ionicons name="close" size={18} color="#E2E8F0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-scrolling Carousel Slides */}
          <View style={styles.sliderWrap} onLayout={handleLayout}>
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
                  syncFromScroll(e);
                  setIsDragging(false);
                }}
                onMomentumScrollEnd={(e) => {
                  syncFromScroll(e);
                  setIsDragging(false);
                }}
              >
                {items.map((item) => {
                  const { course, type, badgeLabel, highlightNote } = item;
                  const ribbon = getModalRibbon(type);
                  const isFree = Boolean(course.isFree) || (course.price ?? 0) <= 0;

                  return (
                    <View key={course.id} style={[styles.slide, { width: slideWidth }]}>
                      <View style={styles.thumbWrap}>
                        {course.thumbnailUrl ? (
                          <Image
                            source={{ uri: course.thumbnailUrl }}
                            style={styles.thumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.thumbPlaceholder}>
                            <Ionicons name="sparkles-outline" size={40} color="#93C5FD" />
                          </View>
                        )}

                        <View style={[styles.ribbon, { backgroundColor: ribbon.bg }]}>
                          <Ionicons name={ribbon.icon} size={11} color="#FFFFFF" />
                          <Text style={styles.ribbonText}>{badgeLabel}</Text>
                        </View>

                        <View style={styles.countdownOverlay}>
                          <Ionicons name="time-outline" size={11} color="#FDE68A" />
                          <Text style={styles.countdownOverlayText}>{countdown}</Text>
                        </View>
                      </View>

                      <View style={styles.slideBody}>
                        <Text variant="h2" style={styles.title} numberOfLines={2}>
                          {course.title}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          {course.instructorName || 'Giảng viên Edumy'} · {highlightNote}
                        </Text>

                        <View style={styles.priceBox}>
                          <View>
                            <Text style={styles.priceLabel}>Học phí ưu đãi hôm nay</Text>
                            <Text style={styles.priceSub}>Truy cập trọn đời · Đồng bộ Web & App</Text>
                          </View>
                          <MoneyText
                            amount={isFree ? 0 : (course.price ?? 0)}
                            style={styles.priceVal}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Navigation Dots & Arrows */}
          {count > 1 && (
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => scrollToIndex(activeIndex - 1)}
                accessibilityRole="button"
                accessibilityLabel="Ưu đãi trước"
              >
                <Ionicons name="chevron-back" size={16} color={semantic.textPrimary} />
              </TouchableOpacity>

              <View style={styles.dotsRow}>
                {items.map((item, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <TouchableOpacity
                      key={item.course.id ?? idx}
                      onPress={() => scrollToIndex(idx)}
                      style={styles.dotTouch}
                      accessibilityRole="button"
                      accessibilityLabel={`Slide ưu đãi ${idx + 1}`}
                    >
                      <View style={[styles.dot, active && styles.dotActive]} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => scrollToIndex(activeIndex + 1)}
                accessibilityRole="button"
                accessibilityLabel="Ưu đãi tiếp theo"
              >
                <Ionicons name="chevron-forward" size={16} color={semantic.textPrimary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Xem chi tiết khóa học"
              onPress={() => handleViewCourse(activeItem?.course.slug)}
            />
            <Button title="Bỏ qua" variant="outline" onPress={handleClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  adBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.4,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWrap: {
    width: '100%',
  },
  slide: {
    backgroundColor: semantic.surfaceCard,
  },
  thumbWrap: {
    width: '100%',
    height: 176,
    backgroundColor: '#1E3A8A',
    position: 'relative',
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
  ribbon: {
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
    color: primitive.white,
    letterSpacing: 0.5,
  },
  countdownOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countdownOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
    fontVariant: ['tabular-nums'],
  },
  slideBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 6,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    color: semantic.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: semantic.textSecondary,
    fontWeight: '600',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
  },
  priceSub: {
    fontSize: 11,
    color: semantic.textSecondary,
    marginTop: 1,
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: semantic.brandPrimary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotTouch: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: semantic.borderStrong,
  },
  dotActive: {
    width: 20,
    backgroundColor: semantic.brandPrimary,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 8,
  },
});
