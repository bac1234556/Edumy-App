// src/features/ads/hooks.ts
// Hooks for Hybrid Ads: Edumy Promoted Courses & live Flash Sale countdown.

import { useEffect, useMemo, useState } from 'react';
import { useCourses } from '../catalog/hooks';
import { useMyEnrollments } from '../learning/hooks';
import {
  getFlashSaleCountdown,
  pickInlineFeedAdCourse,
  pickModalPromoCourses,
  selectPromotedCourses,
} from './logic';

export function usePromotedCourses(limit: number = 6) {
  const { data: hotData, isLoading: isHotLoading } = useCourses({
    price: 'paid',
    sort: 'rating',
    size: 6,
  });

  const { data: valueData, isLoading: isValueLoading } = useCourses({
    price: 'paid',
    sort: 'price_asc',
    size: 6,
  });

  const { data: newestPaidData, isLoading: isNewestLoading } = useCourses({
    price: 'paid',
    sort: 'newest',
    size: 6,
  });

  const { data: fallbackData } = useCourses({
    sort: 'newest',
    size: 6,
  });

  const { data: enrollmentsPage } = useMyEnrollments(0);

  const promotedCourses = useMemo(() => {
    const ownedIds = (enrollmentsPage?.content ?? [])
      .map((e) => e.course?.id)
      .filter((id): id is number => typeof id === 'number');

    return selectPromotedCourses({
      hotCourses: hotData?.content ?? [],
      budgetCourses: valueData?.content ?? [],
      newestCourses: newestPaidData?.content ?? [],
      fallbackCourses: fallbackData?.content ?? [],
      ownedCourseIds: ownedIds,
      limit,
    });
  }, [
    enrollmentsPage?.content,
    hotData?.content,
    valueData?.content,
    newestPaidData?.content,
    fallbackData?.content,
    limit,
  ]);

  const modalCourses = useMemo(
    () => pickModalPromoCourses(promotedCourses, 3),
    [promotedCourses]
  );

  const inlineFeedCourse = useMemo(
    () => pickInlineFeedAdCourse(promotedCourses),
    [promotedCourses]
  );

  return {
    promotedCourses,
    modalCourses,
    inlineFeedCourse,
    isLoading: isHotLoading || isValueLoading || isNewestLoading,
  };
}

export function useFlashSaleCountdown(): string {
  const [countdown, setCountdown] = useState<string>(() => getFlashSaleCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getFlashSaleCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return countdown;
}
