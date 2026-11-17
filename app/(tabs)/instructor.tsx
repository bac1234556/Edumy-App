// app/(tabs)/instructor.tsx — Chế độ thu nhập giảng viên (Instructor Money Mode - M08)
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useEarningsSummary,
  useCourseEarnings,
  useMonthlyEarnings,
} from '../../src/features/instructor/hooks';
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { Ionicons } from '@expo/vector-icons';

export default function InstructorTabScreen() {
  const router = useRouter();
  const { me } = useSessionStore();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
    isRefetching,
  } = useEarningsSummary();

  const { data: courses, refetch: refetchCourses } = useCourseEarnings();
  const { data: monthly, refetch: refetchMonthly } = useMonthlyEarnings();

  const handleRefresh = React.useCallback(() => {
    refetchSummary();
    refetchCourses();
    refetchMonthly();
  }, [refetchSummary, refetchCourses, refetchMonthly]);

  useRefetchOnScreenFocus(handleRefresh);

  if (isSummaryLoading) {
    return <Loading message="Đang tải dữ liệu thu nhập..." />;
  }

  if (isSummaryError) {
    return (
      <ErrorState
        message={summaryError?.message || 'Không thể tải bảng tổng kết thu nhập.'}
        onRetry={handleRefresh}
      />
    );
  }

  const holdDays = summary?.holdDays;
  const maturityText =
    holdDays === 0
      ? 'Thu nhập khả dụng ngay sau khi đơn hàng được thanh toán (chế độ demo)'
      : `Mỗi khoản thu nhập khả dụng sau ${holdDays ?? 7} ngày kể từ khi đơn hàng được thanh toán`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Thu nhập Giảng viên</Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Chào mừng {me?.fullName || 'Giảng viên'}, đây là tổng kết doanh thu và số dư của bạn.
        </Text>
      </View>

      {/* Main Available Balance Hero Card */}
      <View style={styles.heroCard}>
        <Text variant="caption" style={styles.heroLabel}>
          SỐ DƯ KHẢ DỤNG ĐỂ RÚT
        </Text>
        <MoneyText amount={summary?.availableBalance || 0} style={styles.heroAmount} />

        <View style={styles.heroActionRow}>
          <Button
            title="Yêu cầu rút tiền"
            onPress={() => router.push('/instructor/withdrawals/new' as const)}
            style={styles.withdrawBtn}
          />
          <Button
            title="Tài khoản nhận"
            variant="outline"
            onPress={() => router.push('/instructor/payout-account' as const)}
            style={styles.accountBtn}
          />
        </View>
      </View>

      {/* Maturity policy notice */}
      <View
        style={[
          styles.maturityNotice,
          holdDays === 0 && styles.demoNotice,
        ]}
      >
        <Ionicons
          name={holdDays === 0 ? 'flash-outline' : 'calendar-outline'}
          size={16}
          color={holdDays === 0 ? '#0D9488' : '#B45309'}
        />
        <Text
          style={[
            styles.maturityText,
            holdDays === 0 && styles.demoNoticeText,
          ]}
        >
          {maturityText}
        </Text>
      </View>

      {/* Financial Breakdown Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Chờ đáo hạn</Text>
          <MoneyText amount={summary?.pendingBalance || 0} style={styles.statValue} />
          <Text style={styles.statSub}>Đáo hạn vào ngày 01</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đang xử lý rút</Text>
          <MoneyText amount={summary?.inWithdrawal || 0} style={styles.statValue} />
          <Text style={styles.statSub}>Yêu cầu đang mở</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đã rút về TK</Text>
          <MoneyText amount={summary?.withdrawn || 0} style={styles.statValue} />
          <Text style={styles.statSub}>Đã hoàn tất</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Tổng thu nhập</Text>
          <MoneyText amount={summary?.totalEarned || 0} style={styles.statValue} />
          <Text style={styles.statSub}>Toàn thời gian</Text>
        </View>
      </View>

      {/* Navigation Quick Links */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/instructor/entries' as const)}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="receipt-outline" size={20} color="#0D9488" />
            <Text style={styles.linkText}>Chi tiết bút toán thu nhập</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/instructor/withdrawals' as const)}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="time-outline" size={20} color="#0D9488" />
            <Text style={styles.linkText}>Lịch sử rút tiền</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Course Earnings Section */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Thu nhập theo khóa học
        </Text>

        {courses && courses.length > 0 ? (
          courses.map((c) => {
            const isMain = c.role === 'main';

            return (
              <View key={c.courseId} style={styles.courseEarningCard}>
                <View style={styles.courseMeta}>
                  <Text numberOfLines={2} style={styles.courseTitle}>
                    {c.courseTitle}
                  </Text>
                  <View
                    style={[
                      styles.roleTag,
                      isMain ? styles.roleMain : styles.roleCo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleTagText,
                        isMain ? styles.roleMainText : styles.roleCoText,
                      ]}
                    >
                      {isMain ? 'Giảng viên chính' : 'Đồng giảng viên'}
                    </Text>
                  </View>
                </View>

                <MoneyText amount={c.amount} style={styles.courseAmount} />
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có phát sinh doanh thu từ khóa học.</Text>
          </View>
        )}

        <Text style={styles.footnote}>
          * Tỷ lệ chia sẻ doanh thu cho đồng giảng viên được thiết lập và quản lý trên website Edumy.
        </Text>
      </View>

      {/* Monthly Breakdown */}
      {monthly && monthly.length > 0 && (
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Doanh thu theo tháng
          </Text>

          {monthly.map((m) => (
            <View key={m.month} style={styles.monthlyRow}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthName}>Tháng {m.month}</Text>
                {m.matured ? (
                  <View style={styles.maturedBadge}>
                    <Text style={styles.maturedText}>Đã đáo hạn</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Chờ đáo hạn</Text>
                  </View>
                )}
              </View>

              <MoneyText amount={m.amount} style={styles.monthAmount} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 4,
    color: '#64748B',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroLabel: {
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#34D399',
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  accountBtn: {
    flex: 1,
    borderColor: '#334155',
  },
  maturityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  demoNotice: {
    backgroundColor: '#E6FFFA',
  },
  maturityText: {
    fontSize: 12,
    color: '#B45309',
    flex: 1,
    lineHeight: 18,
  },
  demoNoticeText: {
    color: '#0D9488',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  quickLinks: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#0F172A',
    marginBottom: 12,
  },
  courseEarningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseMeta: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 6,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleMain: {
    backgroundColor: '#E6FFFA',
  },
  roleCo: {
    backgroundColor: '#EEF2FF',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleMainText: {
    color: '#0D9488',
  },
  roleCoText: {
    color: '#6366F1',
  },
  courseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  footnote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  monthlyRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  maturedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  maturedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
});
