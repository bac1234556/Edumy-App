// src/features/instructor/components/EarningsSection.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CourseEarning, EarningsSummary, MonthlyEarning } from '../api';
import { formatHoldDaysExplanation, formatNextMaturityLine } from '../logic';
import { Text } from '../../../components/ui/Text';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Loading } from '../../../components/ui/Loading';
import { ErrorState } from '../../../components/ui/ErrorState';
import { radius, semantic } from '../../../theme/tokens';

interface EarningsSectionProps {
  summary?: EarningsSummary;
  courses?: CourseEarning[];
  monthly?: MonthlyEarning[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function EarningsSection({
  summary,
  courses,
  monthly,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: EarningsSectionProps) {
  const router = useRouter();

  if (isLoading) {
    return <Loading message="Đang tải dữ liệu thu nhập..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={errorMessage || 'Không thể tải bảng tổng kết thu nhập.'}
        onRetry={onRetry}
      />
    );
  }

  const holdDays = summary?.holdDays ?? 0;
  const holdExplanation = formatHoldDaysExplanation(summary?.holdDays);
  const nextMaturityLine = formatNextMaturityLine(summary?.nextMaturityAt);

  return (
    <View style={styles.container}>
      {/* Hero Balance */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>SỐ DƯ KHẢ DỤNG ĐỂ RÚT</Text>
        <MoneyText amount={summary?.availableBalance ?? 0} style={styles.heroAmount} />
        <Text style={styles.heroNote}>
          Thu nhập thực nhận đã trừ 30% phí nền tảng và phần chia đồng giảng viên.
        </Text>
      </View>

      {/* BR-PAY-HOLD Notice */}
      <View style={[styles.holdNotice, holdDays === 0 && styles.holdNoticeDemo]}>
        <Ionicons
          name={holdDays === 0 ? 'flash-outline' : 'time-outline'}
          size={18}
          color={holdDays === 0 ? '#0D9488' : '#B45309'}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.holdText, holdDays === 0 && styles.holdTextDemo]}>
            {holdExplanation}
          </Text>
          {nextMaturityLine && (
            <Text style={styles.nextMaturityText}>{nextMaturityLine}</Text>
          )}
        </View>
      </View>

      {/* Breakdown Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đang chờ khả dụng</Text>
          <MoneyText amount={summary?.pendingBalance ?? 0} style={styles.statValue} />
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đang rút</Text>
          <MoneyText amount={summary?.inWithdrawal ?? 0} style={styles.statValue} />
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đã rút về TK</Text>
          <MoneyText amount={summary?.withdrawn ?? 0} style={styles.statValue} />
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Thu nhập thực nhận</Text>
          <MoneyText amount={summary?.totalEarned ?? 0} style={styles.statValue} />
        </View>
      </View>

      {/* Link to detailed entries */}
      <TouchableOpacity
        style={styles.entriesLink}
        onPress={() => router.push('/instructor/entries' as const)}
      >
        <View style={styles.linkLeft}>
          <Ionicons name="receipt-outline" size={20} color="#0D9488" />
          <Text style={styles.linkText}>Chi tiết bút toán thu nhập</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* Course Earnings */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Thu nhập thực nhận theo khóa học
        </Text>
        {courses && courses.length > 0 ? (
          courses.map((c, idx) => {
            const isMain = c.role === 'main';
            return (
              <View key={c.courseId ?? idx} style={styles.courseCard}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text numberOfLines={2} style={styles.courseTitle}>
                    {c.courseTitle}
                  </Text>
                  <Text style={styles.roleText}>
                    {isMain ? 'Giảng viên chính' : 'Đồng giảng viên'}
                  </Text>
                </View>
                <MoneyText amount={c.amount ?? 0} style={styles.courseAmount} />
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Chưa có phát sinh thu nhập từ khóa học.</Text>
        )}
      </View>

      {/* Monthly Earnings */}
      {monthly && monthly.length > 0 && (
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Thu nhập theo tháng
          </Text>
          {monthly.map((m, idx) => (
            <View key={m.month ?? idx} style={styles.monthlyRow}>
              <View style={styles.monthLeft}>
                <Text style={styles.monthName}>Tháng {m.month}</Text>
                <View style={m.matured ? styles.maturedBadge : styles.pendingBadge}>
                  <Text style={m.matured ? styles.maturedText : styles.pendingBadgeText}>
                    {m.matured ? 'Đã khả dụng' : 'Đang chờ'}
                  </Text>
                </View>
              </View>
              <MoneyText amount={m.amount ?? 0} style={styles.monthAmount} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    padding: 18,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34D399',
    marginVertical: 8,
  },
  heroNote: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  holdNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  holdNoticeDemo: {
    backgroundColor: '#CCFBF1',
  },
  holdText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 17,
  },
  holdTextDemo: {
    color: '#0F766E',
  },
  nextMaturityText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 4,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    padding: 13,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  statLabel: {
    fontSize: 12,
    color: semantic.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  entriesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 2,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.surfaceCard,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  roleText: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 2,
  },
  courseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: semantic.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCard,
    padding: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  maturedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  maturedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
});
