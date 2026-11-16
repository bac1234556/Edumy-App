// app/instructor/withdrawals/index.tsx — Lịch sử rút tiền (M09, BR-51, AC-M17)
import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useWithdrawals,
  useCancelWithdrawal,
} from '../../../src/features/instructor/hooks';
import {
  getWithdrawalStatusInfo,
  maskAccountNumber,
} from '../../../src/features/instructor/logic';
import { WithdrawalRecord } from '../../../src/features/instructor/api';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { formatDateTime } from '../../../src/lib/date';

export default function WithdrawalsHistoryScreen() {
  const router = useRouter();
  const { data: withdrawalsData, isLoading, isError, error, refetch, isRefetching } = useWithdrawals();
  const { mutate: cancelWithdrawal, isPending: isCancelling } = useCancelWithdrawal();

  const withdrawals = withdrawalsData?.content || [];

  const handleCancel = (item: WithdrawalRecord) => {
    Alert.alert(
      'Xác nhận hủy yêu cầu',
      `Bạn có chắc chắn muốn hủy yêu cầu rút ${item.amount.toLocaleString('vi-VN')} đ này không? Số tiền sẽ được hoàn lại vào số dư khả dụng ngay lập tức.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy yêu cầu',
          style: 'destructive',
          onPress: () => {
            cancelWithdrawal(item.id, {
              onSuccess: () => {
                Alert.alert('Thành công', 'Yêu cầu rút tiền đã được hủy.');
              },
              onError: (err) => {
                Alert.alert('Lỗi', err.message || 'Không thể hủy yêu cầu rút tiền.');
              },
            });
          },
        },
      ]
    );
  };

  const renderWithdrawalItem = ({ item }: { item: WithdrawalRecord }) => {
    const statusInfo = getWithdrawalStatusInfo(item.status);
    const isRequested = item.status === 'requested';
    const isPaid = item.status === 'paid';
    const isRejected = item.status === 'rejected';

    return (
      <View style={styles.card}>
        {/* Header: Amount & Status Badge */}
        <View style={styles.cardHeader}>
          <MoneyText amount={item.amount} style={styles.amount} />
          <View style={[styles.badge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Bank & Account Meta */}
        <View style={styles.bankRow}>
          <Ionicons name="card-outline" size={16} color="#64748B" />
          <Text style={styles.bankText}>
            {item.bankName} • {maskAccountNumber(item.accountNumberLast4)} ({item.accountHolder})
          </Text>
        </View>

        {/* Created At */}
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color="#94A3B8" />
          <Text style={styles.dateText}>
            Tạo lúc: {formatDateTime(item.createdAt)}
          </Text>
        </View>

        {/* Paid Info */}
        {isPaid && item.transferReference && (
          <View style={styles.paidInfoBox}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.paidInfoText}>
              Mã giao dịch: <Text style={styles.refText}>{item.transferReference}</Text>
            </Text>
          </View>
        )}

        {/* Rejected Reason */}
        {isRejected && item.rejectReason && (
          <View style={styles.rejectedInfoBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.rejectedInfoText}>
              Lý do từ chối: {item.rejectReason}
            </Text>
          </View>
        )}

        {/* Cancel Button if status == requested */}
        {isRequested && (
          <View style={styles.actionRow}>
            <Button
              title="Hủy yêu cầu"
              variant="outline"
              onPress={() => handleCancel(item)}
              disabled={isCancelling}
              style={styles.cancelBtn}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text variant="h2" style={styles.title}>
            Lịch sử rút tiền
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/instructor/withdrawals/new' as const)}
          accessibilityRole="button"
          accessibilityLabel="Tạo yêu cầu rút mới"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Rút tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <Loading message="Đang tải lịch sử rút tiền..." />
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Không thể tải lịch sử rút tiền.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderWithdrawalItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState
              title="Chưa có yêu cầu rút tiền"
              description="Bạn chưa tạo yêu cầu rút tiền nào từ hệ thống."
            />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
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
    marginBottom: 10,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bankText: {
    fontSize: 13,
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  paidInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  paidInfoText: {
    fontSize: 12,
    color: '#166534',
  },
  refText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rejectedInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  rejectedInfoText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    borderColor: '#CBD5E1',
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});