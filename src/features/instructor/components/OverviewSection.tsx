// src/features/instructor/components/OverviewSection.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InstructorOverview } from '../api';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Loading } from '../../../components/ui/Loading';
import { ErrorState } from '../../../components/ui/ErrorState';
import { formatDate } from '../../../lib/date';
import { monoFontFamily, radius, semantic } from '../../../theme/tokens';

export type InstructorTabKey = 'overview' | 'courses' | 'qa' | 'earnings' | 'withdrawals';

interface OverviewSectionProps {
  overview?: InstructorOverview;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  errorMessage?: string;
  onRetry: () => void;
  onNavigateTab: (tab: InstructorTabKey) => void;
}

export function OverviewSection({
  overview,
  isLoading,
  isError,
  error,
  errorMessage,
  onRetry,
  onNavigateTab,
}: OverviewSectionProps) {
  const [chartMetric, setChartMetric] = useState<'netEarnings' | 'enrollments'>('netEarnings');

  if (isLoading) {
    return <Loading message="Đang tải tổng quan giảng viên..." />;
  }

  if (isError || !overview) {
    return (
      <ErrorState
        error={error}
        message={errorMessage || 'Không thể tải tổng quan giảng viên.'}
        onRetry={onRetry}
      />
    );
  }

  const totals = overview.totals;
  const money = overview.money;
  const series = overview.series30d ?? [];
  const maxVal = Math.max(
    1,
    ...series.map((p) =>
      chartMetric === 'netEarnings' ? (p.netEarnings ?? 0) : (p.enrollments ?? 0)
    )
  );

  return (
    <View style={styles.container}>
      {/* Action Badges */}
      <View style={styles.badgeRow}>
        <TouchableOpacity
          style={styles.actionBadge}
          onPress={() => onNavigateTab('qa')}
          activeOpacity={0.78}
          accessibilityRole="button"
        >
          <Ionicons name="help-circle-outline" size={16} color={semantic.warning} />
          <Text style={styles.actionBadgeText}>
            {overview.unansweredQuestions ?? 0} câu hỏi chờ trả lời
          </Text>
          <Ionicons name="chevron-forward" size={14} color={semantic.warning} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBadge, styles.inviteBadge]}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.78}
          accessibilityRole="button"
        >
          <Ionicons name="mail-unread-outline" size={16} color={semantic.brandPrimary} />
          <Text style={[styles.actionBadgeText, { color: semantic.brandPrimaryStrong }]}>
            {overview.pendingInvitations ?? 0} lời mời
          </Text>
          <Ionicons name="chevron-forward" size={14} color={semantic.brandPrimary} />
        </TouchableOpacity>
      </View>

      {/* Primary Financial Hero Card (Light Pure White & Ocean Blue) */}
      <Card style={styles.financeHeroCard}>
        <View style={styles.heroAccentStrip}>
          <Text style={styles.heroOverline}>Thu nhập thực nhận</Text>
          <MoneyText amount={money?.netEarnings ?? 0} style={styles.heroPrimaryMoney} />
          <Text style={styles.heroNote}>
            Đã trừ 30% phí nền tảng và phần chia đồng giảng viên
          </Text>
        </View>

        <View style={styles.financeSubRow}>
          <View style={styles.financeSubCell}>
            <Text style={styles.financeSubLabel}>Số dư khả dụng</Text>
            <MoneyText amount={money?.availableBalance ?? 0} style={styles.availValue} />
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.financeSubCell}>
            <Text style={styles.financeSubLabel}>Đang chờ</Text>
            <MoneyText amount={money?.pendingBalance ?? 0} style={styles.pendingValue} />
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.financeSubCell}>
            <Text style={styles.financeSubLabel}>Doanh số bán</Text>
            <MoneyText amount={money?.grossSales ?? 0} style={styles.grossValue} />
          </View>
        </View>
      </Card>

      {/* Supporting Teaching Metrics Strip */}
      <Card style={styles.teachingStripCard}>
        <View style={styles.teachingStrip}>
          <View style={styles.teachingCell}>
            <Text style={styles.teachingLabel}>Khóa học</Text>
            <Text style={styles.teachingValue}>
              {totals?.publishedCourses ?? 0}/{totals?.courses ?? 0}
            </Text>
            <Text style={styles.teachingSub}>Đã xuất bản</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.teachingCell}>
            <Text style={styles.teachingLabel}>Học viên</Text>
            <Text style={styles.teachingValue}>{totals?.students ?? 0}</Text>
            <Text style={styles.teachingSub}>Đang theo học</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.teachingCell}>
            <Text style={styles.teachingLabel}>Đánh giá TB</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color={semantic.ratingStar} />
              <Text style={styles.teachingValue}>
                {totals?.averageRating ? totals.averageRating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={styles.teachingSub}>{totals?.ratingCount ?? 0} lượt</Text>
          </View>
        </View>
      </Card>

      {/* 30-Day Bar Chart */}
      <Card>
        <View style={styles.chartHeader}>
          <Text variant="h3">Biểu đồ 30 ngày</Text>
          <View style={styles.chartToggle}>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                chartMetric === 'netEarnings' && styles.toggleChipActive,
              ]}
              onPress={() => setChartMetric('netEarnings')}
            >
              <Text
                style={[
                  styles.toggleChipText,
                  chartMetric === 'netEarnings' && styles.toggleChipTextActive,
                ]}
              >
                Thu nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                chartMetric === 'enrollments' && styles.toggleChipActive,
              ]}
              onPress={() => setChartMetric('enrollments')}
            >
              <Text
                style={[
                  styles.toggleChipText,
                  chartMetric === 'enrollments' && styles.toggleChipTextActive,
                ]}
              >
                Ghi danh
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {series.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu trong 30 ngày gần nhất.</Text>
        ) : (
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {series.map((point, idx) => {
                const value =
                  chartMetric === 'netEarnings'
                    ? (point.netEarnings ?? 0)
                    : (point.enrollments ?? 0);
                const heightPct = value > 0 ? Math.max(6, Math.round((value / maxVal) * 100)) : 2;
                return (
                  <View key={point.date ?? idx} style={styles.barWrap}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor:
                            value > 0 ? semantic.brandPrimary : semantic.borderSubtle,
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartAxisRow}>
              <Text style={styles.axisText}>{series[0]?.date ?? ''}</Text>
              <Text style={styles.axisText}>
                {series[series.length - 1]?.date ?? ''}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* 5 Recent Reviews */}
      <Card>
        <Text variant="h3" style={{ marginBottom: 10 }}>
          5 đánh giá mới nhất
        </Text>
        {overview.recentReviews && overview.recentReviews.length > 0 ? (
          overview.recentReviews.slice(0, 5).map((rev, idx) => (
            <View
              key={rev.id ?? idx}
              style={[
                styles.reviewItem,
                idx === Math.min(4, (overview.recentReviews?.length ?? 1) - 1) && {
                  borderBottomWidth: 0,
                  paddingBottom: 0,
                },
              ]}
            >
              <View style={styles.reviewTop}>
                <Text style={styles.reviewCourse} numberOfLines={1}>
                  {rev.courseTitle}
                </Text>
                <View style={styles.reviewStars}>
                  <Ionicons name="star" size={13} color={semantic.ratingStar} />
                  <Text style={styles.reviewRating}>{rev.rating ?? 0}</Text>
                </View>
              </View>
              <Text style={styles.reviewMeta}>
                {rev.studentName || 'Học viên'} · {formatDate(rev.createdAt ?? '')}
              </Text>
              {Boolean(rev.comment) && (
                <Text style={styles.reviewComment} numberOfLines={2}>
                  {rev.comment}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Chưa có đánh giá nào gần đây.</Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: radius.pill,
  },
  inviteBadge: {
    backgroundColor: semantic.brandSoft,
    borderColor: semantic.brandBorder,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.warning,
    fontVariant: ['tabular-nums'],
  },
  financeHeroCard: {
    padding: 0,
    overflow: 'hidden',
    borderColor: semantic.brandBorder,
  },
  heroAccentStrip: {
    backgroundColor: semantic.brandSoft,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: semantic.brandBorder,
  },
  heroOverline: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    marginBottom: 4,
  },
  heroPrimaryMoney: {
    fontSize: 26,
    fontWeight: '800',
    color: semantic.brandPrimary,
    marginBottom: 4,
  },
  heroNote: {
    fontSize: 12,
    color: semantic.textSecondary,
  },
  financeSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: semantic.surfaceCard,
  },
  financeSubCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  financeSubLabel: {
    fontSize: 11,
    color: semantic.textMuted,
    fontWeight: '600',
  },
  availValue: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.success,
  },
  pendingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.warning,
  },
  grossValue: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: semantic.borderSubtle,
  },
  teachingStripCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  teachingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teachingCell: {
    flex: 1,
    alignItems: 'center',
  },
  teachingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: semantic.textMuted,
    marginBottom: 3,
  },
  teachingValue: {
    fontFamily: monoFontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  teachingSub: {
    fontSize: 11,
    color: semantic.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceMuted,
  },
  toggleChipActive: {
    backgroundColor: semantic.brandPrimary,
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textSecondary,
  },
  toggleChipTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    paddingTop: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    paddingBottom: 2,
  },
  barWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  axisText: {
    fontSize: 11,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    fontSize: 13,
    color: semantic.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  reviewCourse: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  reviewMeta: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  reviewComment: {
    fontSize: 13,
    color: semantic.textBody,
    marginTop: 4,
    lineHeight: 18,
  },
});
