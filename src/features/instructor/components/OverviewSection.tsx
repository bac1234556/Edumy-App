// src/features/instructor/components/OverviewSection.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InstructorOverview } from '../api';
import { Text } from '../../../components/ui/Text';
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
  errorMessage?: string;
  onRetry: () => void;
  onNavigateTab: (tab: InstructorTabKey) => void;
}

export function OverviewSection({
  overview,
  isLoading,
  isError,
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
          activeOpacity={0.75}
        >
          <Ionicons name="help-circle-outline" size={16} color="#B45309" />
          <Text style={styles.actionBadgeText}>
            {overview.unansweredQuestions ?? 0} câu hỏi chờ trả lời
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#B45309" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBadge, styles.inviteBadge]}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.75}
        >
          <Ionicons name="mail-unread-outline" size={16} color={semantic.brandPrimaryStrong} />
          <Text style={[styles.actionBadgeText, { color: semantic.brandPrimaryStrong }]}>
            {overview.pendingInvitations ?? 0} lời mời
          </Text>
          <Ionicons name="chevron-forward" size={14} color={semantic.brandPrimaryStrong} />
        </TouchableOpacity>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Khóa học</Text>
          <Text style={styles.kpiValue}>
            {totals?.publishedCourses ?? 0} / {totals?.courses ?? 0}
          </Text>
          <Text style={styles.kpiSub}>Đã xuất bản / Tổng</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Học viên</Text>
          <Text style={styles.kpiValue}>{totals?.students ?? 0}</Text>
          <Text style={styles.kpiSub}>Đang theo học</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Đánh giá TB</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color="#D97706" />
            <Text style={styles.kpiValue}>
              {totals?.averageRating ? totals.averageRating.toFixed(1) : '—'}
            </Text>
          </View>
          <Text style={styles.kpiSub}>{totals?.ratingCount ?? 0} lượt đánh giá</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Doanh số bán</Text>
          <MoneyText amount={money?.grossSales ?? 0} style={styles.kpiMoney} />
          <Text style={styles.kpiSub}>Tổng giá trị đơn hàng</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCardFull]}>
          <View style={styles.netHeaderRow}>
            <Text style={styles.kpiLabel}>Thu nhập thực nhận</Text>
            <MoneyText amount={money?.netEarnings ?? 0} style={styles.netMoney} />
          </View>
          <Text style={styles.netNote}>
            đã trừ 30% phí nền tảng và phần chia đồng giảng viên
          </Text>
          <View style={styles.balanceStrip}>
            <View style={styles.balancePair}>
              <Text style={styles.balanceLabel}>Khả dụng:</Text>
              <MoneyText amount={money?.availableBalance ?? 0} style={styles.balanceAvail} />
            </View>
            <View style={styles.balancePair}>
              <Text style={styles.balanceLabel}>Đang chờ:</Text>
              <MoneyText amount={money?.pendingBalance ?? 0} style={styles.balancePending} />
            </View>
          </View>
        </View>
      </View>

      {/* 30-Day Bar Chart (View-only, zero extra chart dependencies) */}
      <View style={styles.sectionCard}>
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
                            value > 0 ? semantic.brandPrimary : '#E2E8F0',
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
      </View>

      {/* 5 Recent Reviews */}
      <View style={styles.sectionCard}>
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
                  <Ionicons name="star" size={13} color="#D97706" />
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
      </View>
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteBadge: {
    backgroundColor: semantic.brandSoft,
    borderColor: semantic.brandBorder,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 13,
  },
  kpiCardFull: {
    width: '100%',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textMuted,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: monoFontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: semantic.textPrimary,
  },
  kpiMoney: {
    fontSize: 16,
    fontWeight: '800',
    color: semantic.textPrimary,
  },
  kpiSub: {
    fontSize: 11,
    color: semantic.textSecondary,
    marginTop: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  netHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netMoney: {
    fontSize: 19,
    fontWeight: '800',
    color: semantic.brandPrimaryStrong,
  },
  netNote: {
    fontSize: 11,
    color: semantic.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 10,
  },
  balanceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: semantic.borderSubtle,
    paddingTop: 8,
  },
  balancePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: semantic.textSecondary,
  },
  balanceAvail: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.success,
  },
  balancePending: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  sectionCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: semantic.surfaceSubtle,
  },
  toggleChipActive: {
    backgroundColor: semantic.brandPrimary,
  },
  toggleChipText: {
    fontSize: 11,
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
    height: 92,
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
    fontSize: 10,
    color: semantic.textMuted,
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
    borderBottomColor: semantic.borderSubtle,
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
    color: '#B45309',
  },
  reviewMeta: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
});
