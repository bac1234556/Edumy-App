// app/instructor/withdrawals/index.tsx — Lịch sử rút tiền (M09, BR-51, AC-M17)
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { confirm, notify } from '../../../src/lib/dialog';
import {
  useCancelWithdrawal,
  useInfiniteWithdrawals,
} from '../../../src/features/instructor/hooks';
import { useRefetchOnScreenFocus } from '../../../src/hooks/useRefetchOnScreenFocus';
import {
  getWithdrawalStatusInfo,
  maskAccountNumber,
} from '../../../src/features/instructor/logic';
import { WithdrawalRecord } from '../../../src/features/instructor/api';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge, BadgeVariant } from '../../../src/components/ui/Badge';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { formatDateTime } from '../../../src/lib/date';
import { layout, microShadow, radius, semantic } from '../../../src/theme/tokens';

function mapWithdrawalVariant(status?: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'requested':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function WithdrawalsHistoryScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteWithdrawals();
  useRefetchOnScreenFocus(refetch);
  const { mutate: cancelWithdrawal, isPending: isCancelling } = useCancelWithdrawal();

  const withdrawals = data?.pages.flatMap((p) => p.content ?? []) ?? [];

  const handleCancel = async (item: WithdrawalRecord) => {
    const itemId = item.id;
    if (itemId === undefined) return;
    const ok = await confirm({
      title: 'Xác nhận hủy yêu cầu',
      message: `Bạn có chắc chắn muốn hủy yêu cầu rút ${(item.amount ?? 0).toLocaleString('vi-VN')} đ này không? Số tiền sẽ được hoàn lại vào số dư khả dụng ngay lập tức.`,
      confirmText: 'Hủy yêu cầu',
      cancelText: 'Không',
      destructive: true,
    });
    if (!ok) return;

    cancelWithdrawal(itemId, {
      onSuccess: () => {
        void notify('Thành công', 'Yêu cầu rút tiền đã được hủy.');
      },
      onError: (err) => {
        void notify('Lỗi', err.message || 'Không thể hủy yêu cầu rút tiền.');
      },
    });
  };

  const renderWithdrawalItem = ({ item }: { item: WithdrawalRecord }) => {
    const normalizedStatus = (item.status ?? '').toLowerCase();
    const statusInfo = getWithdrawalStatusInfo(item.status ?? '');
    const isRequested = normalizedStatus === 'requested';
    const isPaid = normalizedStatus === 'paid';
    const isRejected = normalizedStatus === 'rejected';

    return (
      <View style={[styles.card, microShadow]}>
        <View style={styles.cardHeader}>
          <MoneyText amount={item.amount} style={styles.amount} />
          <Badge
            label={statusInfo.label}
            variant={mapWithdrawalVariant(item.status)}
          />
        </View>

        <View style={styles.bankRow}>
          <Ionicons name="card-outline" size={16} color={semantic.textMuted} />
          <Text style={styles.bankText}>
            {item.bankName} · {maskAccountNumber(item.accountNumberLast4)} ({item.accountHolder})
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color={semantic.textPlaceholder} />
          <Text style={styles.dateText}>
            Tạo lúc: {formatDateTime(item.createdAt)}
          </Text>
        </View>

        {isPaid && Boolean(item.transferReference) && (
          <View style={styles.paidInfoBox}>
            <Ionicons name="checkmark-circle-outline" size={16} color={semantic.success} />
            <Text style={styles.paidInfoText}>
              Mã giao dịch: <Text style={styles.refText}>{item.transferReference}</Text>
            </Text>
          </View>
        )}

        {isRejected && Boolean(item.rejectReason) && (
          <View style={styles.rejectedInfoBox}>
            <Ionicons name="alert-circle-outline" size={16} color={semantic.danger} />
            <Text style={styles.rejectedInfoText}>
              Lý do từ chối: {item.rejectReason}
            </Text>
          </View>
        )}

        {isRequested && (
          <View style={styles.actionRow}>
            <Button
              title="Hủy yêu cầu"
              variant="outline"
              onPress={() => handleCancel(item)}
              disabled={isCancelling}
              loading={isCancelling}
              style={styles.cancelBtn}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Lịch sử rút tiền',
          headerBackTitle: 'Quay lại',
          headerRight: () => (
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => router.push('/instructor/withdrawals/new' as const)}
              accessibilityRole="button"
              accessibilityLabel="Tạo yêu cầu rút tiền mới"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.newBtnText}>Rút tiền</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <Loading message="Đang tải lịch sử rút tiền..." />
      ) : isError ? (
        <ErrorState
          error={error}
          message={error?.message || 'Không thể tải lịch sử rút tiền.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderWithdrawalItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} color={semantic.brandPrimary} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có yêu cầu rút tiền"
              description="Bạn chưa tạo yêu cầu rút tiền nào từ hệ thống."
              actionTitle="Rút tiền"
              onAction={() => router.push('/instructor/withdrawals/new' as const)}
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
    backgroundColor: semantic.surfaceCanvas,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: semantic.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: radius.btn,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  card: {
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
    marginBottom: 10,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bankText: {
    fontSize: 13,
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  paidInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: semantic.successSoft,
    borderWidth: 1,
    borderColor: semantic.successBorder,
    padding: 10,
    borderRadius: radius.btn,
    marginTop: 8,
  },
  paidInfoText: {
    fontSize: 12,
    color: semantic.success,
  },
  refText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rejectedInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 10,
    borderRadius: radius.btn,
    marginTop: 8,
  },
  rejectedInfoText: {
    fontSize: 12,
    color: semantic.danger,
    flex: 1,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
    paddingTop: 12,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
});
