// src/features/instructor/components/WithdrawalsSection.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EarningsSummary, WithdrawalRecord } from '../api';
import { getWithdrawalStatusInfo, maskAccountNumber } from '../logic';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { MoneyText } from '../../../components/ui/MoneyText';
import { formatDateTime } from '../../../lib/date';
import { radius, semantic } from '../../../theme/tokens';

interface WithdrawalsSectionProps {
  summary?: EarningsSummary;
  withdrawals?: WithdrawalRecord[];
}

export function WithdrawalsSection({ summary, withdrawals }: WithdrawalsSectionProps) {
  const router = useRouter();
  const minWithdrawal = summary?.minWithdrawal ?? 100000;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.label}>SỐ DƯ KHẢ DỤNG</Text>
        <MoneyText amount={summary?.availableBalance ?? 0} style={styles.amount} />
        <Text style={styles.minNote}>
          Mức rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')} đ
        </Text>

        <View style={styles.actionsRow}>
          <Button
            title="Yêu cầu rút tiền"
            onPress={() => router.push('/instructor/withdrawals/new' as const)}
            style={{ flex: 1 }}
          />
          <Button
            title="Tài khoản nhận"
            variant="outline"
            onPress={() => router.push('/instructor/payout-account' as const)}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.allLink}
        onPress={() => router.push('/instructor/withdrawals' as const)}
      >
        <View style={styles.linkLeft}>
          <Ionicons name="time-outline" size={20} color={semantic.brandPrimary} />
          <Text style={styles.linkText}>Quản lý tất cả yêu cầu rút tiền</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <View style={styles.recentBlock}>
        <Text variant="h3">Yêu cầu gần đây</Text>
        {withdrawals && withdrawals.length > 0 ? (
          withdrawals.slice(0, 5).map((item, idx) => {
            const statusInfo = getWithdrawalStatusInfo(item.status ?? '');
            return (
              <View key={item.id ?? idx} style={styles.wdCard}>
                <View style={styles.wdTop}>
                  <MoneyText amount={item.amount ?? 0} style={styles.wdAmount} />
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.wdBank}>
                  {item.bankName} · {maskAccountNumber(item.accountNumberLast4)}
                </Text>
                <Text style={styles.wdDate}>
                  {formatDateTime(item.createdAt ?? '')}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Chưa có yêu cầu rút tiền nào.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  summaryCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.6,
  },
  amount: {
    fontSize: 26,
    fontWeight: '800',
    color: semantic.brandPrimaryStrong,
    marginVertical: 6,
  },
  minNote: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  allLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
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
  recentBlock: {
    gap: 8,
  },
  wdCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 13,
    gap: 4,
  },
  wdTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wdAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  wdBank: {
    fontSize: 12,
    color: semantic.textSecondary,
  },
  wdDate: {
    fontSize: 11,
    color: semantic.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: semantic.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
