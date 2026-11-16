// app/orders/index.tsx — Lịch sử đơn hàng (Read-only)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useOrders } from '../../src/features/orders/hooks';
import { OrderSummary, getOrderStatusConfig } from '../../src/features/orders/logic';
import { Text } from '../../src/components/ui/Text';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { formatDateTime } from '../../src/lib/date';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersListScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useOrders(page);
  const orders = data?.content || [];

  if (isLoading) {
    return <Loading message="Đang tải lịch sử đơn hàng..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Không thể tải lịch sử đơn hàng'}
        onRetry={() => refetch()}
      />
    );
  }

  const renderOrderItem = ({ item }: { item: OrderSummary }) => {
    const statusConfig = getOrderStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.orderCode}` as const)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderCode}>{item.orderCode}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.dateText}>{formatDateTime(item.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="book-outline" size={14} color="#64748B" />
            <Text style={styles.itemsCountText}>{item.itemCount} khóa học</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <MoneyText amount={item.totalAmount} style={styles.totalAmount} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Lịch sử đơn hàng', headerBackTitle: 'Quay lại' }} />

      {orders.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="receipt-outline" size={56} color="#94A3B8" />}
          title="Chưa có đơn hàng nào"
          description="Bạn chưa thực hiện đơn đặt khóa học nào trên Edumy."
          actionTitle="Khám phá khóa học"
          onAction={() => router.push('/')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderCode}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (data?.page && page + 1 < data.page.totalPages) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.4}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
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
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
  },
  itemsCountText: {
    fontSize: 13,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
