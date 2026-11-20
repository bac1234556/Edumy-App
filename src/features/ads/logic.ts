// src/features/ads/logic.ts
// Pure business logic for Hybrid Ads (Edumy Promoted Courses, Flash Sale countdown & AdMob cooldown).

import { CourseCard } from '../catalog/api';

export const DEFAULT_INTERSTITIAL_COOLDOWN_MS = 60_000;
const PROMO_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export type PromotedCourseBadgeType = 'HOT' | 'VALUE' | 'NEW';

export interface PromotedCourseItem {
  course: CourseCard;
  type: PromotedCourseBadgeType;
  badgeLabel: string;
  highlightNote: string;
}

export interface SelectPromotedCoursesInput {
  hotCourses: CourseCard[];
  budgetCourses: CourseCard[];
  newestCourses?: CourseCard[];
  fallbackCourses?: CourseCard[];
  ownedCourseIds?: number[];
  limit?: number;
}

/**
 * Enforce minimum cooldown between AdMob Interstitial impressions so users are not spammed.
 */
export function shouldShowInterstitial(
  lastShownAt: number | null,
  now: number = Date.now(),
  cooldownMs: number = DEFAULT_INTERSTITIAL_COOLDOWN_MS
): boolean {
  if (cooldownMs <= 0) return true;
  if (lastShownAt === null) return true;
  return now - lastShownAt >= cooldownMs;
}

function isEligibleCourse(
  course: CourseCard,
  ownedSet: Set<number>,
  requirePaid: boolean
): boolean {
  if (!course.id || !course.slug) return false;
  if (ownedSet.has(course.id)) return false;
  if (requirePaid) {
    if (course.isFree) return false;
    if ((course.price ?? 0) <= 0) return false;
  }
  return true;
}

function buildHotNote(course: CourseCard): string {
  const ratingCount = course.ratingCount ?? 0;
  if (ratingCount > 0 && typeof course.averageRating === 'number') {
    return `${course.averageRating.toFixed(1)}★ (${ratingCount} đánh giá)`;
  }
  return 'Được học viên yêu thích';
}

function buildValueNote(course: CourseCard): string {
  if (course.categoryName) {
    return `Ưu đãi ${course.categoryName}`;
  }
  return 'Học phí tiết kiệm nhất';
}

function buildNewNote(course: CourseCard): string {
  if (course.categoryName) {
    return `Mới cập nhật · ${course.categoryName}`;
  }
  return 'Nội dung mới cập nhật';
}

/**
 * Merge hot (top-rated), best-value, and newest paid courses into a deduplicated promoted list,
 * excluding courses already owned by the current learner. Falls back to general catalog courses
 * if fewer than 3 paid courses are available so ad slots stay populated.
 */
export function selectPromotedCourses({
  hotCourses,
  budgetCourses,
  newestCourses = [],
  fallbackCourses = [],
  ownedCourseIds = [],
  limit = 6,
}: SelectPromotedCoursesInput): PromotedCourseItem[] {
  if (limit <= 0) return [];

  const ownedSet = new Set(ownedCourseIds);
  const seenIds = new Set<number>();

  const hotEligible = hotCourses.filter((c) => isEligibleCourse(c, ownedSet, true));
  const valueEligible = budgetCourses.filter((c) => isEligibleCourse(c, ownedSet, true));
  const newEligible = newestCourses.filter((c) => isEligibleCourse(c, ownedSet, true));

  const queues: {
    items: CourseCard[];
    idx: number;
    type: PromotedCourseBadgeType;
    badgeLabel: string;
    buildNote: (c: CourseCard) => string;
  }[] = [
    {
      items: hotEligible,
      idx: 0,
      type: 'HOT',
      badgeLabel: 'HOT · BÁN CHẠY',
      buildNote: buildHotNote,
    },
    {
      items: valueEligible,
      idx: 0,
      type: 'VALUE',
      badgeLabel: 'DEAL SỐC',
      buildNote: buildValueNote,
    },
    {
      items: newEligible,
      idx: 0,
      type: 'NEW',
      badgeLabel: 'MỚI RA MẮT',
      buildNote: buildNewNote,
    },
  ];

  const result: PromotedCourseItem[] = [];
  let progressed = true;

  while (result.length < limit && progressed) {
    progressed = false;
    for (const queue of queues) {
      if (result.length >= limit) break;
      while (queue.idx < queue.items.length) {
        const candidate = queue.items[queue.idx++];
        if (candidate.id !== undefined && !seenIds.has(candidate.id)) {
          seenIds.add(candidate.id);
          result.push({
            course: candidate,
            type: queue.type,
            badgeLabel: queue.badgeLabel,
            highlightNote: queue.buildNote(candidate),
          });
          progressed = true;
          break;
        }
      }
    }
  }

  // Fallback to general catalog courses if fewer than 3 paid courses are eligible
  const minTarget = Math.min(3, limit);
  if (result.length < minTarget && fallbackCourses.length > 0) {
    for (const candidate of fallbackCourses) {
      if (result.length >= minTarget) break;
      if (!isEligibleCourse(candidate, ownedSet, false)) continue;
      if (candidate.id === undefined || seenIds.has(candidate.id)) continue;
      seenIds.add(candidate.id);
      const isFree = Boolean(candidate.isFree) || (candidate.price ?? 0) <= 0;
      result.push({
        course: candidate,
        type: isFree ? 'NEW' : 'HOT',
        badgeLabel: isFree ? 'MỚI RA MẮT' : 'HOT · BÁN CHẠY',
        highlightNote: isFree ? 'Miễn phí trải nghiệm ngay' : buildHotNote(candidate),
      });
    }
  }

  return result;
}

/**
 * Select up to `maxCount` (default 3) courses for the once-per-session spotlight modal carousel.
 */
export function pickModalPromoCourses(
  promoted: PromotedCourseItem[],
  maxCount: number = 3
): PromotedCourseItem[] {
  if (maxCount <= 0) return [];
  return promoted.slice(0, maxCount);
}

/**
 * Select 1 course for the in-feed sponsored ad card, preferring the 2nd item so it
 * differs from the #1 hero banner whenever possible.
 */
export function pickInlineFeedAdCourse(promoted: PromotedCourseItem[]): PromotedCourseItem | null {
  if (promoted.length >= 2) return promoted[1];
  return promoted[0] ?? null;
}

/**
 * Compute remaining time until 23:59:59 today in Asia/Ho_Chi_Minh as "HH:MM:SS".
 */
export function getFlashSaleCountdown(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: PROMO_TIME_ZONE,
  }).formatToParts(now);

  const hourRaw = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const hour = hourRaw % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? '0');

  const elapsed = hour * 3600 + minute * 60 + second;
  const remaining = Math.max(0, 24 * 3600 - 1 - elapsed);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
