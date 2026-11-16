// app/orders/[orderCode].tsx — Chi tiết đơn hàng (Read-only + Resume on Web)
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useOrderDetail } from '../../src/features/orders/hooks';
import {
  getOrderStatusConfig,
  getCancelReasonLabel,
  OrderItem,
} from '../../src/features/orders/logic';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { formatDateTime } from '../../src/lib/date';
import { webLinks } from '../../src/lib/web-links';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailScreen() {
  const { orderCode } = useLocalSearchParams<{ orderCode: string }>();
  const router = useRouter();

  const { data: order, isLoading, isError, error, refetch, isRefetching } = useOrderDetail(
    orderCode || ''
  );

  if (isLoading) {
    return <Loading message="Đang tải chi tiết đơn hàng..." />;
  }

  if (isError || !order) {
    return (
      <ErrorState
        message={error?.message || 'Không tìm thấy thông tin đơn hàng.'}
        onRetry={() => refetch()}
      />
    );
  }

  const statusConfig = getOrderStatusConfig(order.status);
  const cancelReason = getCancelReasonLabel(order.cancelReason);

  const handleResumeOnWeb = () => {
    Linking.openURL(webLinks.order(order.orderCode));
  };

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.courseId} style={styles.itemRow}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.itemThumbnail} />
      ) : (
        <View style={styles.itemPlaceholderThumbnail}>
          <Ionicons name="school-outline" size={20} color="#0D9488" />
        </View>
      )}

      <View style={styles.itemInfo}>
        <TouchableOpacity onPress={() => router.push(`/courses/${item.slug}` as const)}>
          <Text numberOfLines={2} style={styles.itemTitle}>
            {item.title}
          </Text>
        </TouchableOpacity>
        <MoneyText amount={item.unitPrice} style={styles.itemPrice} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Đơn ${order.orderCode}`,
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text variant="caption" style={styles.codeLabel}>
                Mã đơn hàng
              </Text>
              <Text style={styles.codeText}>{order.orderCode}</Text>
            </View>

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

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>Tạo lúc: {formatDateTime(order.createdAt)}</Text>
          </View>

          {order.paidAt && (
            <View style={styles.metaRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
              <Text style={styles.metaText}>Thanh toán lúc: {formatDateTime(order.paidAt)}</Text>
            </View>
          )}

          {cancelReason && (
            <View style={styles.cancelBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.cancelReasonText}>Lý do hủy: {cancelReason}</Text>
            </View>
          )}
        </View>

        {/* Pending Notice & Web Action (Rules 40) */}
        {order.status === 'pending' && (
          <View style={styles.pendingActionBox}>
            <View style={styles.pendingHeader}>
              <Ionicons name="information-circle" size={20} color="#D97706" />
              <Text style={styles.pendingTitle}>Đơn đang chờ thanh toán</Text>
            </View>
            <Text style={styles.pendingDesc}>
              Vui lòng tiếp tục thanh toán trên website để kích hoạt các khóa học trong đơn này.
            </Text>
            <Button
              title="Tiếp tục trên website"
              onPress={handleResumeOnWeb}
              style={styles.webActionButton}
            />
          </View>
        )}

        {/* Items List */}
        <View style={styles.sectionCard}>
          <Text variant="h3" style={styles.sectionTitle}>
            Danh sách khóa học ({order.items?.length || 0})
          </Text>

          <View style={styles.itemsList}>
            {order.items?.map(renderOrderItem)}
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.sectionCard}>
          <Text variant="h3" style={styles.sectionTitle}>
            Tổng thanh toán
          </Text>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Tổng giá trị khóa học</Text>
            <MoneyText amount={order.totalAmount} style={styles.summaryValue} />
          </View>

          <View style={[styles.summaryLine, styles.totalLine]}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <MoneyText amount={order.totalAmount} style={styles.totalValue} />
          </View>
        </View>
      </ScrollView>
    </View>
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeLabel: {
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  cancelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  cancelReasonText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  pendingActionBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B45309',
  },
  pendingDesc: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 12,
  },
  webActionButton: {
    backgroundColor: '#0D9488',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#0F172A',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemThumbnail: {
    width: 60,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  itemPlaceholderThumbnail: {
    width: 60,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 2,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: '#0F172A',
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
});
