// src/features/ads/__tests__/logic.test.ts
// Unit tests for Hybrid Ads business logic (Q-M01).

import { CourseCard } from '../../catalog/api';
import {
  DEFAULT_INTERSTITIAL_COOLDOWN_MS,
  getFlashSaleCountdown,
  pickInlineFeedAdCourse,
  pickModalPromoCourses,
  selectPromotedCourses,
  shouldShowInterstitial,
} from '../logic';

function makeCourse(overrides: Partial<CourseCard>): CourseCard {
  return {
    id: 1,
    slug: 'react-native-pro',
    title: 'React Native Thực Chiến',
    price: 499000,
    isFree: false,
    averageRating: 4.9,
    ratingCount: 25,
    instructorName: 'Nguyễn Văn A',
    categoryName: 'Lập trình di động',
    ...overrides,
  };
}

describe('Hybrid Ads Logic (Q-M01)', () => {
  describe('shouldShowInterstitial', () => {
    it('allows showing when never shown before', () => {
      expect(shouldShowInterstitial(null, 1_000_000)).toBe(true);
    });

    it('blocks showing during cooldown window and allows once elapsed', () => {
      const last = 1_000_000;
      expect(shouldShowInterstitial(last, last + DEFAULT_INTERSTITIAL_COOLDOWN_MS - 1)).toBe(false);
      expect(shouldShowInterstitial(last, last + DEFAULT_INTERSTITIAL_COOLDOWN_MS)).toBe(true);
    });

    it('always allows when cooldown is 0', () => {
      expect(shouldShowInterstitial(1_000_000, 1_000_001, 0)).toBe(true);
    });
  });

  describe('selectPromotedCourses', () => {
    it('interleaves HOT, VALUE, and NEW paid courses while excluding free and owned courses', () => {
      const hot = [
        makeCourse({ id: 1, slug: 'free-course', price: 0, isFree: true }),
        makeCourse({ id: 2, slug: 'owned-course', price: 599000 }),
        makeCourse({ id: 3, slug: 'hot-paid', price: 799000, averageRating: 4.8, ratingCount: 12 }),
      ];
      const budget = [makeCourse({ id: 4, slug: 'budget-paid', price: 199000 })];
      const newest = [makeCourse({ id: 5, slug: 'new-paid', price: 399000 })];

      const selected = selectPromotedCourses({
        hotCourses: hot,
        budgetCourses: budget,
        newestCourses: newest,
        ownedCourseIds: [2],
        limit: 6,
      });

      expect(selected.map((s) => s.course.id)).toEqual([3, 4, 5]);
      expect(selected[0].type).toBe('HOT');
      expect(selected[0].badgeLabel).toBe('HOT · BÁN CHẠY');
      expect(selected[0].highlightNote).toContain('4.8★');
      expect(selected[1].type).toBe('VALUE');
      expect(selected[1].badgeLabel).toBe('DEAL SỐC');
      expect(selected[2].type).toBe('NEW');
      expect(selected[2].badgeLabel).toBe('MỚI RA MẮT');
    });

    it('deduplicates overlapping courses and respects limit', () => {
      const shared = makeCourse({ id: 10, slug: 'shared-course', price: 299000 });
      const hot = [
        shared,
        makeCourse({ id: 11, slug: 'hot-2', price: 699000 }),
        makeCourse({ id: 12, slug: 'hot-3', price: 899000 }),
      ];
      const budget = [shared, makeCourse({ id: 13, slug: 'val-2', price: 149000 })];
      const newest = [shared, makeCourse({ id: 14, slug: 'new-2', price: 449000 })];

      const selected = selectPromotedCourses({
        hotCourses: hot,
        budgetCourses: budget,
        newestCourses: newest,
        limit: 4,
      });

      expect(selected.map((s) => s.course.id)).toEqual([10, 13, 14, 11]);
    });

    it('falls back to general catalog courses when fewer than 3 paid courses are eligible', () => {
      const hot = [makeCourse({ id: 20, slug: 'only-paid', price: 499000 })];
      const fallback = [
        makeCourse({ id: 20, slug: 'only-paid', price: 499000 }),
        makeCourse({ id: 21, slug: 'free-1', price: 0, isFree: true }),
        makeCourse({ id: 22, slug: 'free-2', price: 0, isFree: true }),
        makeCourse({ id: 23, slug: 'free-3', price: 0, isFree: true }),
      ];

      const selected = selectPromotedCourses({
        hotCourses: hot,
        budgetCourses: [],
        fallbackCourses: fallback,
        limit: 6,
      });

      expect(selected.map((s) => s.course.id)).toEqual([20, 21, 22]);
      expect(selected[1].highlightNote).toContain('Miễn phí');
    });

    it('returns empty array when limit <= 0 or no eligible courses', () => {
      expect(selectPromotedCourses({ hotCourses: [], budgetCourses: [], limit: 5 })).toEqual([]);
      expect(
        selectPromotedCourses({
          hotCourses: [makeCourse({ id: 1 })],
          budgetCourses: [],
          limit: 0,
        })
      ).toEqual([]);
    });
  });

  describe('pickModalPromoCourses & pickInlineFeedAdCourse', () => {
    it('returns up to 3 courses for modal carousel and picks 2nd course for inline feed ad', () => {
      const items = selectPromotedCourses({
        hotCourses: [
          makeCourse({ id: 1, slug: 'c1' }),
          makeCourse({ id: 4, slug: 'c4' }),
        ],
        budgetCourses: [makeCourse({ id: 2, slug: 'c2' })],
        newestCourses: [makeCourse({ id: 3, slug: 'c3' })],
        limit: 6,
      });

      const modal = pickModalPromoCourses(items, 3);
      expect(modal.map((m) => m.course.id)).toEqual([1, 2, 3]);

      const inline = pickInlineFeedAdCourse(items);
      expect(inline?.course.id).toBe(2);
    });

    it('handles empty or single-item lists gracefully', () => {
      expect(pickModalPromoCourses([], 3)).toEqual([]);
      expect(pickInlineFeedAdCourse([])).toBeNull();

      const single = selectPromotedCourses({
        hotCourses: [makeCourse({ id: 99, slug: 'only' })],
        budgetCourses: [],
      });
      expect(pickInlineFeedAdCourse(single)?.course.id).toBe(99);
    });
  });

  describe('getFlashSaleCountdown', () => {
    it('computes remaining HH:MM:SS until 23:59:59 in Asia/Ho_Chi_Minh', () => {
      // 2026-11-20T14:30:00Z = 21:30:00 Asia/Ho_Chi_Minh -> 02:29:59 remaining
      expect(getFlashSaleCountdown(new Date('2026-11-20T14:30:00Z'))).toBe('02:29:59');
      // 2026-11-20T17:00:00Z = 00:00:00 Asia/Ho_Chi_Minh -> 23:59:59 remaining
      expect(getFlashSaleCountdown(new Date('2026-11-20T17:00:00Z'))).toBe('23:59:59');
      // 2026-11-20T16:59:59Z = 23:59:59 Asia/Ho_Chi_Minh -> 00:00:00 remaining
      expect(getFlashSaleCountdown(new Date('2026-11-20T16:59:59Z'))).toBe('00:00:00');
    });
  });
});
