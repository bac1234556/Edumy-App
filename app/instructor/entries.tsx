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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useEarningEntries,
  useCourseEarnings,
  useMonthlyEarnings,
} from '../../src/features/instructor/hooks';
import { EarningEntry } from '../../src/features/instructor/api';
import { Text } from '../../src/components/ui/Text';
import { Badge } from '../../src/components/ui/Badge';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { formatDate, formatDateTime } from '../../src/lib/date';
import { layout, microShadow, monoFontFamily, radius, semantic } from '../../src/theme/tokens';

export default function InstructorEntriesScreen() {
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
      <View style={[styles.entryCard, microShadow]}>
        <View style={styles.cardHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderCode}>Đơn hàng #{item.orderCode}</Text>
          </View>
          <Badge
            variant={isMain ? 'info' : 'neutral'}
            label={isMain ? 'GV chính' : 'Đồng GV'}
          />
        </View>

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
          <View style={styles.datesCol}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={semantic.textMuted} />
              <Text style={styles.dateText}>
                Ghi nhận: {formatDateTime(item.earnedAt)}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={13} color={semantic.textMuted} />
              <Text style={styles.dateText}>
                Khả dụng từ: {formatDate(item.maturesAt)}
              </Text>
            </View>
          </View>
          <Badge
            variant={item.matured ? 'success' : 'warning'}
            label={item.matured ? 'Đã khả dụng' : 'Đang chờ'}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Bút toán thu nhập', headerBackTitle: 'Quay lại' }} />

      {/* Filter Section */}
      {((monthly && monthly.length > 0) || (courses && courses.length > 0)) && (
        <View style={styles.filtersSection}>
          <ResponsiveContainer maxWidth={layout.maxContentWidth}>
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
          </ResponsiveContainer>
        </View>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <Loading message="Đang tải danh sách bút toán..." />
      ) : isError ? (
        <ErrorState
          error={error}
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
    backgroundColor: semantic.surfaceCanvas,
  },
  filtersSection: {
    backgroundColor: semantic.surfacePage,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    paddingVertical: 8,
  },
  filterPillsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  pillActive: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  entryCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderBadge: {
    backgroundColor: semantic.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderCode: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  calcGrid: {
    flexDirection: 'row',
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.btn,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcCol: {
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 11,
    color: semantic.textMuted,
    marginBottom: 3,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  calcPct: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  payoutValue: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
    paddingTop: 10,
  },
  datesCol: {
    gap: 3,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  footerNotice: {
    marginTop: 8,
    padding: 12,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.btn,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  noticeText: {
    fontSize: 12,
    color: semantic.textMuted,
    lineHeight: 17,
  },
});
