// app/instructor/entries.tsx — Danh sách bút toán thu nhập (M08)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useEarningEntries,
  useCourseEarnings,
  useMonthlyEarnings,
} from '../../src/features/instructor/hooks';
import { EarningEntry } from '../../src/features/instructor/api';
import { Text } from '../../src/components/ui/Text';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { formatDate, formatDateTime } from '../../src/lib/date';

export default function InstructorEntriesScreen() {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  const { data: courses } = useCourseEarnings();
  const { data: monthly } = useMonthlyEarnings();

  const {
    data: entriesData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEarningEntries({
    courseId: selectedCourseId,
    month: selectedMonth,
  });

  const entries = entriesData?.content || [];

  const renderEntryItem = ({ item }: { item: EarningEntry }) => {
    const isMain = item.role === 'main';
    const platformFeePct = ((item.platformFeeBps ?? 0) / 100).toFixed(0);
    const sharePct = ((item.shareBps ?? 0) / 100).toFixed(0);

    return (
      <View style={styles.entryCard}>
        {/* Top row: Order Code & Role */}
        <View style={styles.cardHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderCode}>Đơn hàng #{item.orderCode}</Text>
          </View>
          <View style={[styles.roleTag, isMain ? styles.roleMain : styles.roleCo]}>
            <Text style={[styles.roleTagText, isMain ? styles.roleMainText : styles.roleCoText]}>
              {isMain ? 'GV chính' : 'Đồng GV'}
            </Text>
          </View>
        </View>

        {/* Course Title */}
        <Text numberOfLines={2} style={styles.courseTitle}>
          {item.courseTitle}
        </Text>

        {/* Financial Calculation Breakdown (Server numbers only) */}
        <View style={styles.calcGrid}>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>Giá bán</Text>
            <MoneyText amount={item.unitPrice} style={styles.calcValue} />
          </View>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>Phí sàn</Text>
            <Text style={styles.calcPct}>{platformFeePct}%</Text>
          </View>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>Tỷ lệ nhận</Text>
            <Text style={styles.calcPct}>{sharePct}%</Text>
          </View>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>Thực nhận</Text>
            <MoneyText amount={item.amount} style={styles.payoutValue} />
          </View>
        </View>

        {/* Dates Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.dateText}>
              Ghi nhận: {formatDateTime(item.earnedAt)}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" />
            <Text style={styles.dateText}>
              Khả dụng từ: {formatDate(item.maturesAt)}
            </Text>
          </View>
          <View style={item.matured ? styles.maturedBadge : styles.pendingBadge}>
            <Text style={item.matured ? styles.maturedBadgeText : styles.pendingBadgeText}>
              {item.matured ? 'Đã khả dụng' : 'Đang chờ'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text variant="h2" style={styles.title}>
          Bút toán thu nhập
        </Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filtersSection}>
        {/* Month Pills */}
        {monthly && monthly.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            <TouchableOpacity
              style={[styles.pill, !selectedMonth && styles.pillActive]}
              onPress={() => setSelectedMonth(undefined)}
            >
              <Text style={[styles.pillText, !selectedMonth && styles.pillTextActive]}>
                Tất cả tháng
              </Text>
            </TouchableOpacity>
            {monthly.map((m) => {
              const active = selectedMonth === m.month;
              return (
                <TouchableOpacity
                  key={m.month}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedMonth(active ? undefined : m.month)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {m.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Course Pills */}
        {courses && courses.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            <TouchableOpacity
              style={[styles.pill, !selectedCourseId && styles.pillActive]}
              onPress={() => setSelectedCourseId(undefined)}
            >
              <Text style={[styles.pillText, !selectedCourseId && styles.pillTextActive]}>
                Tất cả khóa học
              </Text>
            </TouchableOpacity>
            {courses.map((c) => {
              const active = selectedCourseId === c.courseId;
              return (
                <TouchableOpacity
                  key={c.courseId}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedCourseId(active ? undefined : c.courseId)}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {c.courseTitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <Loading message="Đang tải danh sách bút toán..." />
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách bút toán.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEntryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="Không có bút toán nào"
              description="Chưa có bút toán thu nhập phù hợp với bộ lọc đã chọn."
            />
          }
          ListFooterComponent={
            entries.length > 0 ? (
              <View style={styles.footerNotice}>
                <Text style={styles.noticeText}>
                  * Tỷ lệ phân chia doanh thu cho đồng giảng viên do Giảng viên chính thiết lập trên
                  website Edumy theo thỏa thuận từng khóa học.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  filterPillsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 12,
  },
  calcGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcCol: {
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  calcPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  payoutValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  maturedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  maturedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
  },
  footerNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});