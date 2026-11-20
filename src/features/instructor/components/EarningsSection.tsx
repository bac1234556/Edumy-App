// src/features/instructor/components/EarningsSection.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CourseEarning, EarningsSummary, MonthlyEarning } from '../api';
import { formatHoldDaysExplanation, formatNextMaturityLine } from '../logic';
import { Text } from '../../../components/ui/Text';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Loading } from '../../../components/ui/Loading';
import { ErrorState } from '../../../components/ui/ErrorState';
import { microShadow, radius, semantic } from '../../../theme/tokens';

interface EarningsSectionProps {
  summary?: EarningsSummary;
  courses?: CourseEarning[];
  monthly?: MonthlyEarning[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  errorMessage?: string;
  onRetry: () => void;
}

export function EarningsSection({
  summary,
  courses,
  monthly,
  isLoading,
  isError,
  error,
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
        error={error}
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
      {/* Primary Light Hero Card: Số dư khả dụng & Thu nhập thực nhận */}
      <Card style={styles.heroCard}>
        <View style={styles.heroAccentHeader}>
          <Text style={styles.heroLabel}>Số dư khả dụng để rút</Text>
          <MoneyText amount={summary?.availableBalance ?? 0} style={styles.heroAmount} />
          <Text style={styles.heroNote}>
            Thu nhập thực nhận đã trừ 30% phí nền tảng và phần chia đồng giảng viên.
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCell}>
            <Text style={styles.breakdownLabel}>Thu nhập thực nhận</Text>
            <MoneyText amount={summary?.totalEarned ?? 0} style={styles.breakdownPrimaryVal} />
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.breakdownCell}>
            <Text style={styles.breakdownLabel}>Đang chờ khả dụng</Text>
            <MoneyText amount={summary?.pendingBalance ?? 0} style={styles.breakdownWarnVal} />
          </View>
        </View>

        <View style={styles.breakdownSecondaryRow}>
          <View style={styles.breakdownPair}>
            <Text style={styles.pairLabel}>Đang rút:</Text>
            <MoneyText amount={summary?.inWithdrawal ?? 0} style={styles.pairValue} />
          </View>
          <View style={styles.breakdownPair}>
            <Text style={styles.pairLabel}>Đã rút về TK:</Text>
            <MoneyText amount={summary?.withdrawn ?? 0} style={styles.pairValue} />
          </View>
        </View>
      </Card>

      {/* BR-PAY-HOLD Rolling Hold Info Box */}
      <View style={[styles.holdNotice, holdDays === 0 && styles.holdNoticeDemo]}>
        <Ionicons
          name={holdDays === 0 ? 'flash-outline' : 'time-outline'}
          size={18}
          color={holdDays === 0 ? semantic.brandPrimary : semantic.warning}
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

      {/* Link to detailed entries */}
      <TouchableOpacity
        style={[styles.entriesLink, microShadow]}
        onPress={() => router.push('/instructor/entries' as const)}
        accessibilityRole="button"
      >
        <View style={styles.linkLeft}>
          <Ionicons name="receipt-outline" size={20} color={semantic.brandPrimary} />
          <Text style={styles.linkText}>Chi tiết bút toán thu nhập</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
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
              <Card key={c.courseId ?? idx} style={styles.courseCard}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text numberOfLines={2} style={styles.courseTitle}>
                    {c.courseTitle}
                  </Text>
                  <Text style={styles.roleText}>
                    {isMain ? 'Giảng viên chính' : 'Đồng giảng viên'}
                  </Text>
                </View>
                <MoneyText amount={c.amount ?? 0} style={styles.courseAmount} />
              </Card>
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
            <Card key={m.month ?? idx} style={styles.monthlyRow}>
              <View style={styles.monthLeft}>
                <Text style={styles.monthName}>Tháng {m.month}</Text>
                <Badge
                  variant={m.matured ? 'success' : 'warning'}
                  label={m.matured ? 'Đã khả dụng' : 'Đang chờ'}
                />
              </View>
              <MoneyText amount={m.amount ?? 0} style={styles.monthAmount} />
            </Card>
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
    padding: 0,
    overflow: 'hidden',
    borderColor: semantic.brandBorder,
  },
  heroAccentHeader: {
    backgroundColor: semantic.brandSoft,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: semantic.brandBorder,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: semantic.brandPrimary,
    marginVertical: 6,
  },
  heroNote: {
    fontSize: 12,
    color: semantic.textSecondary,
    lineHeight: 18,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
  },
  breakdownCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: semantic.borderSubtle,
  },
  breakdownLabel: {
    fontSize: 12,
    color: semantic.textMuted,
    fontWeight: '600',
  },
  breakdownPrimaryVal: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  breakdownWarnVal: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.warning,
  },
  breakdownSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: semantic.surfaceCanvas,
  },
  breakdownPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pairLabel: {
    fontSize: 12,
    color: semantic.textMuted,
  },
  pairValue: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  holdNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    padding: 12,
    borderRadius: radius.card,
    gap: 8,
  },
  holdNoticeDemo: {
    backgroundColor: semantic.brandSoft,
    borderColor: semantic.brandBorder,
  },
  holdText: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.warning,
    lineHeight: 18,
  },
  holdTextDemo: {
    color: semantic.brandPrimaryStrong,
  },
  nextMaturityText: {
    fontSize: 11,
    color: semantic.warning,
    marginTop: 4,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  entriesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 14,
    minHeight: 52,
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
    padding: 14,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  roleText: {
    fontSize: 12,
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
    padding: 14,
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
    fontVariant: ['tabular-nums'],
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
});
