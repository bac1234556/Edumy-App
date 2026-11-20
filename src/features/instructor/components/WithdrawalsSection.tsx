// src/features/instructor/components/WithdrawalsSection.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EarningsSummary, WithdrawalRecord } from '../api';
import {
  DEFAULT_MIN_WITHDRAWAL,
  getWithdrawalStatusInfo,
  maskAccountNumber,
  resolveMonthlyWithdrawalStatus,
} from '../logic';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { MoneyText } from '../../../components/ui/MoneyText';
import { formatDateTime } from '../../../lib/date';
import { microShadow, radius, semantic } from '../../../theme/tokens';

interface WithdrawalsSectionProps {
  summary?: EarningsSummary;
  withdrawals?: WithdrawalRecord[];
}

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

export function WithdrawalsSection({ summary, withdrawals }: WithdrawalsSectionProps) {
  const router = useRouter();
  const minWithdrawal = summary?.minWithdrawal ?? DEFAULT_MIN_WITHDRAWAL;
  const monthlyStatus = resolveMonthlyWithdrawalStatus(summary, withdrawals);

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Text style={styles.label}>Số dư khả dụng</Text>
        <MoneyText amount={summary?.availableBalance ?? 0} style={styles.amount} />
        <Text style={styles.minNote}>
          Mức rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')} đ · Tối đa{' '}
          {monthlyStatus.maxPerMonth} lần/tháng
        </Text>

        {monthlyStatus.limitReached && monthlyStatus.message && (
          <View style={styles.limitBanner}>
            <Ionicons name="calendar-outline" size={16} color={semantic.warning} />
            <Text style={styles.limitBannerText}>{monthlyStatus.message}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            title={monthlyStatus.limitReached ? 'Đã rút tháng này' : 'Rút tiền'}
            disabled={monthlyStatus.limitReached}
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
      </Card>

      <TouchableOpacity
        style={[styles.allLink, microShadow]}
        onPress={() => router.push('/instructor/withdrawals' as const)}
        accessibilityRole="button"
      >
        <View style={styles.linkLeft}>
          <Ionicons name="time-outline" size={20} color={semantic.brandPrimary} />
          <Text style={styles.linkText}>Quản lý tất cả yêu cầu rút tiền</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
      </TouchableOpacity>

      <View style={styles.recentBlock}>
        <Text variant="h3">Yêu cầu gần đây</Text>
        {withdrawals && withdrawals.length > 0 ? (
          withdrawals.slice(0, 5).map((item, idx) => {
            const statusInfo = getWithdrawalStatusInfo(item.status ?? '');
            return (
              <Card key={item.id ?? idx} style={styles.wdCard}>
                <View style={styles.wdTop}>
                  <MoneyText amount={item.amount ?? 0} style={styles.wdAmount} />
                  <Badge
                    label={statusInfo.label}
                    variant={mapWithdrawalVariant(item.status)}
                  />
                </View>
                <Text style={styles.wdBank}>
                  {item.bankName} · {maskAccountNumber(item.accountNumberLast4)}
                </Text>
                <Text style={styles.wdDate}>
                  {formatDateTime(item.createdAt ?? '')}
                </Text>
              </Card>
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
    borderColor: semantic.brandBorder,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textSecondary,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: semantic.brandPrimary,
    marginVertical: 6,
  },
  minNote: {
    fontSize: 12,
    color: semantic.textMuted,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    borderRadius: radius.btn,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  limitBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: semantic.warning,
    fontWeight: '600',
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
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
    minHeight: 52,
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
    padding: 14,
    gap: 4,
  },
  wdTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wdAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  wdBank: {
    fontSize: 13,
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  wdDate: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    fontSize: 13,
    color: semantic.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
