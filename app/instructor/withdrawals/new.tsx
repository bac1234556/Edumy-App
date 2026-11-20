// app/instructor/withdrawals/new.tsx — Tạo yêu cầu rút tiền (M09, BR-51, AC-M16)
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { confirm, notify } from '../../../src/lib/dialog';
import {
  useEarningsSummary,
  useInfiniteWithdrawals,
  usePayoutAccount,
  useRequestWithdrawal,
} from '../../../src/features/instructor/hooks';
import {
  DEFAULT_MIN_WITHDRAWAL,
  formatHoldDaysExplanation,
  formatNextMaturityLine,
  maskAccountNumber,
  resolveMonthlyWithdrawalStatus,
  resolveWithdrawalErrorAction,
  validateWithdrawalAmount,
} from '../../../src/features/instructor/logic';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../../src/api/problem';
import { layout, radius, semantic } from '../../../src/theme/tokens';

export default function NewWithdrawalScreen() {
  const router = useRouter();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useEarningsSummary();

  const {
    data: payoutAccount,
    isLoading: isAccountLoading,
    isError: isAccountError,
    error: accountError,
    refetch: refetchAccount,
  } = usePayoutAccount();

  const { data: withdrawalsData } = useInfiniteWithdrawals();

  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawal();

  const [rawAmount, setRawAmount] = useState<string>('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  if (isSummaryLoading || isAccountLoading) {
    return <Loading message="Đang tải thông tin số dư..." />;
  }

  if (isSummaryError) {
    return (
      <ErrorState
        error={summaryError}
        message={summaryError?.message || 'Không thể tải thông tin số dư.'}
        onRetry={refetchSummary}
      />
    );
  }

  const appErr = accountError as unknown as AppError;
  const isActualAccountError = isAccountError && appErr?.status !== 404;
  if (isActualAccountError) {
    return (
      <ErrorState
        error={accountError}
        message={appErr?.message || 'Không thể tải thông tin tài khoản ngân hàng.'}
        onRetry={refetchAccount}
      />
    );
  }

  const availableBalance = summary?.availableBalance ?? 0;
  const minWithdrawal = summary?.minWithdrawal ?? DEFAULT_MIN_WITHDRAWAL;
  const recentWithdrawals = withdrawalsData?.pages.flatMap((p) => p.content ?? []) ?? [];
  const monthlyStatus = resolveMonthlyWithdrawalStatus(summary, recentWithdrawals);
  const holdExplanation = formatHoldDaysExplanation(summary?.holdDays);
  const nextMaturityLine = formatNextMaturityLine(summary?.nextMaturityAt);
  const hasPayoutAccount = Boolean(payoutAccount && payoutAccount.accountNumberLast4);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setRawAmount(cleaned);
    setClientError(null);
    setServerError(null);
  };

  const handleChipPress = (amount: number) => {
    setRawAmount(String(amount));
    setClientError(null);
    setServerError(null);
  };

  const handleSubmit = async () => {
    if (isPending) return;
    setClientError(null);
    setServerError(null);

    if (!hasPayoutAccount) {
      const ok = await confirm({
        title: 'Yêu cầu tài khoản nhận tiền',
        message: 'Bạn cần thiết lập tài khoản ngân hàng nhận tiền trước khi tạo yêu cầu rút.',
        confirmText: 'Thiết lập ngay',
        cancelText: 'Hủy',
      });
      if (ok) {
        router.push('/instructor/payout-account' as const);
      }
      return;
    }

    const numericAmount = parseInt(rawAmount, 10);
    const validation = validateWithdrawalAmount(numericAmount, availableBalance, minWithdrawal);
    if (!validation.valid) {
      setClientError(validation.message || 'Số tiền rút không hợp lệ.');
      return;
    }

    requestWithdrawal(numericAmount, {
      onSuccess: async () => {
        await notify(
          'Yêu cầu thành công',
          `Yêu cầu rút ${numericAmount.toLocaleString('vi-VN')} đ đã được tạo và đang chờ duyệt.`
        );
        router.replace('/instructor/withdrawals' as const);
      },
      onError: async (err) => {
        const resolution = resolveWithdrawalErrorAction(
          err as unknown as AppError,
          minWithdrawal
        );
        if (resolution.action === 'confirm_payout_account') {
          const goSetup = await confirm({
            title: 'Yêu cầu tài khoản nhận tiền',
            message: resolution.message,
            confirmText: 'Thiết lập ngay',
            cancelText: 'Hủy',
          });
          if (goSetup) {
            router.push('/instructor/payout-account' as const);
          }
        } else if (resolution.action === 'go_withdrawals_list') {
          await notify('Đang có yêu cầu chờ duyệt', resolution.message);
          router.replace('/instructor/withdrawals' as const);
        } else if (resolution.action === 'amount_field_error') {
          setClientError(resolution.message);
        } else {
          setServerError(resolution.message);
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Rút tiền', headerBackTitle: 'Quay lại' }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer maxWidth={layout.maxReadingWidth}>
          {monthlyStatus.limitReached && monthlyStatus.message && (
            <View style={styles.warningBanner}>
              <Ionicons name="calendar-outline" size={20} color={semantic.warning} />
              <Text style={styles.warningBannerText}>{monthlyStatus.message}</Text>
            </View>
          )}

          {serverError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={semantic.danger} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Available Balance Box (Light Pure White & Ocean Blue) */}
          <Card variant="soft" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <MoneyText amount={availableBalance} style={styles.balanceAmount} />
            <Text style={styles.balanceHint}>
              Hạn mức rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')} đ · Tối đa{' '}
              {monthlyStatus.maxPerMonth} lần/tháng
            </Text>
            <Text style={[styles.balanceHint, { marginTop: 4 }]}>{holdExplanation}</Text>
            {nextMaturityLine && (
              <Text style={[styles.balanceHint, { marginTop: 2, fontWeight: '700' }]}>
                {nextMaturityLine}
              </Text>
            )}
          </Card>

          {/* Destination Account Card */}
          <Card style={styles.accountCard}>
            <Text style={styles.accountCardLabel}>Tài khoản nhận tiền</Text>
            {hasPayoutAccount ? (
              <View style={styles.accountInfoRow}>
                <View style={styles.bankIconWrapper}>
                  <Ionicons name="business-outline" size={20} color={semantic.brandPrimary} />
                </View>
                <View style={styles.accountMeta}>
                  <Text style={styles.bankName}>{payoutAccount?.bankName}</Text>
                  <Text style={styles.accountNumber}>
                    {maskAccountNumber(payoutAccount?.accountNumberLast4)} ·{' '}
                    {payoutAccount?.accountHolder}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/instructor/payout-account' as const)}
                  style={styles.changeAccountBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.changeAccountText}>Đổi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noAccountBox}>
                <Ionicons name="warning-outline" size={20} color={semantic.warning} />
                <Text style={styles.noAccountText}>Chưa có tài khoản ngân hàng nhận tiền</Text>
                <Button
                  title="Thiết lập ngay"
                  variant="outline"
                  style={styles.setupBtn}
                  onPress={() => router.push('/instructor/payout-account' as const)}
                />
              </View>
            )}
          </Card>

          {/* Amount Input Form */}
          <Card style={styles.formCard}>
            <Text variant="label">Số tiền muốn rút (VNĐ)</Text>
            <View
              style={[
                styles.inputContainer,
                (Boolean(clientError) || Boolean(serverError)) && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={semantic.textPlaceholder}
                keyboardType="number-pad"
                value={rawAmount}
                onChangeText={handleAmountChange}
                editable={!isPending && !monthlyStatus.limitReached}
              />
              <Text style={styles.currencySuffix}>đ</Text>
            </View>

            {clientError && <Text style={styles.errorText}>{clientError}</Text>}

            {/* Quick Amount Chips */}
            <View style={styles.chipsRow}>
              {[1000000, 2000000, 5000000].map((chipAmount) => {
                const disabled =
                  monthlyStatus.limitReached ||
                  chipAmount < minWithdrawal ||
                  chipAmount > availableBalance;
                return (
                  <TouchableOpacity
                    key={chipAmount}
                    style={[styles.chip, disabled && styles.chipDisabled]}
                    disabled={disabled}
                    onPress={() => handleChipPress(chipAmount)}
                  >
                    <Text style={[styles.chipText, disabled && styles.chipTextDisabled]}>
                      {chipAmount >= 1000000
                        ? `${(chipAmount / 1000000).toLocaleString('vi-VN')}tr`
                        : `${(chipAmount / 1000).toLocaleString('vi-VN')}k`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.chip,
                  (monthlyStatus.limitReached || availableBalance < minWithdrawal) &&
                    styles.chipDisabled,
                ]}
                disabled={monthlyStatus.limitReached || availableBalance < minWithdrawal}
                onPress={() => handleChipPress(availableBalance)}
              >
                <Text
                  style={[
                    styles.chipText,
                    styles.chipAllText,
                    (monthlyStatus.limitReached || availableBalance < minWithdrawal) &&
                      styles.chipTextDisabled,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={
                monthlyStatus.limitReached
                  ? 'Đã đạt giới hạn rút tháng này'
                  : isPending
                    ? 'Đang gửi yêu cầu...'
                    : 'Gửi yêu cầu rút tiền'
              }
              onPress={handleSubmit}
              loading={isPending}
              disabled={isPending || monthlyStatus.limitReached || !rawAmount}
              style={styles.submitBtn}
            />
          </Card>

          {/* Policy explanation */}
          <View style={styles.policyNotice}>
            <Ionicons name="time-outline" size={18} color={semantic.textMuted} />
            <Text style={styles.policyText}>
              Mức rút tối thiểu {minWithdrawal.toLocaleString('vi-VN')} đ và tối đa{' '}
              {monthlyStatus.maxPerMonth} lần mỗi tháng dương lịch. Yêu cầu sau khi gửi sẽ ở trạng
              thái &quot;Đang chờ duyệt&quot; và được quản trị viên duyệt chuyển khoản. Nếu yêu cầu
              bị từ chối hoặc bạn tự hủy khi chưa duyệt, lượt rút trong tháng không bị mất.
            </Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 12,
    borderRadius: radius.btn,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: semantic.danger,
    lineHeight: 18,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    padding: 12,
    borderRadius: radius.btn,
    marginBottom: 14,
    gap: 8,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 13,
    color: semantic.warning,
    lineHeight: 18,
    fontWeight: '600',
  },
  balanceCard: {
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: semantic.brandPrimary,
    marginVertical: 6,
  },
  balanceHint: {
    fontSize: 12,
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
    lineHeight: 17,
  },
  accountCard: {
    marginBottom: 14,
  },
  accountCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textMuted,
    marginBottom: 10,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.btn,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountMeta: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  accountNumber: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  changeAccountBtn: {
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.btn,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
  },
  changeAccountText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  noAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    padding: 12,
    borderRadius: radius.btn,
    flexWrap: 'wrap',
  },
  noAccountText: {
    flex: 1,
    fontSize: 12,
    color: semantic.warning,
  },
  setupBtn: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  formCard: {
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.input,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  inputError: {
    borderColor: semantic.danger,
  },
  currencySuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textMuted,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    color: semantic.danger,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  chip: {
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textBody,
    fontVariant: ['tabular-nums'],
  },
  chipTextDisabled: {
    color: semantic.textPlaceholder,
  },
  chipAllText: {
    color: semantic.brandPrimary,
  },
  submitBtn: {
    marginTop: 4,
  },
  policyNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    alignItems: 'center',
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: semantic.textSecondary,
    lineHeight: 18,
  },
});
