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
import { confirm, notify } from '../../../src/lib/dialog';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useEarningsSummary,
  usePayoutAccount,
  useRequestWithdrawal,
} from '../../../src/features/instructor/hooks';
import {
  validateWithdrawalAmount,
  maskAccountNumber,
} from '../../../src/features/instructor/logic';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { AppError } from '../../../src/api/problem';

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
        message={appErr?.message || 'Không thể tải thông tin tài khoản ngân hàng.'}
        onRetry={refetchAccount}
      />
    );
  }

  const availableBalance = summary?.availableBalance || 0;
  const minWithdrawal = summary?.minWithdrawal || 100000;
  const hasPayoutAccount = Boolean(payoutAccount && payoutAccount.accountNumberLast4);

  const handleAmountChange = (text: string) => {
    // Only accept numeric characters
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
          `Yêu cầu rút ${numericAmount.toLocaleString('vi-VN')} đ đã được tạo và đang chờ xử lý.`
        );
        router.replace('/instructor/withdrawals' as const);
      },
      onError: (err) => {
        const appError = err as unknown as AppError;
        if (appError.code === 'WITHDRAWAL_BELOW_MINIMUM') {
          setServerError(`Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString('vi-VN')} đ.`);
        } else if (appError.code === 'WITHDRAWAL_EXCEEDS_BALANCE') {
          setServerError('Số tiền yêu cầu vượt quá số dư khả dụng hiện có.');
        } else if (appError.code === 'WITHDRAWAL_ALREADY_OPEN') {
          setServerError(
            'Bạn đang có một yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi quản trị viên duyệt hoặc hủy yêu cầu cũ trước khi tạo yêu cầu mới.'
          );
        } else if (appError.code === 'PAYOUT_ACCOUNT_REQUIRED') {
          setServerError('Vui lòng thiết lập tài khoản nhận tiền trước khi rút.');
        } else {
          setServerError(appError.message || 'Không thể tạo yêu cầu rút tiền.');
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Header */}
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
            Yêu cầu rút tiền
          </Text>
        </View>

        {serverError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Available Balance Box */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SỐ DƯ KHẢ DỤNG</Text>
          <MoneyText amount={availableBalance} style={styles.balanceAmount} />
          <Text style={styles.balanceHint}>
            Hạn mức rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {/* Destination Account Card */}
        <View style={styles.accountCard}>
          <Text style={styles.accountCardLabel}>TÀI KHOẢN NHẬN TIỀN</Text>
          {hasPayoutAccount ? (
            <View style={styles.accountInfoRow}>
              <View style={styles.bankIconWrapper}>
                <Ionicons name="business-outline" size={20} color="#0D9488" />
              </View>
              <View style={styles.accountMeta}>
                <Text style={styles.bankName}>{payoutAccount?.bankName}</Text>
                <Text style={styles.accountNumber}>
                  {maskAccountNumber(payoutAccount?.accountNumberLast4)} •{' '}
                  {payoutAccount?.accountHolder}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/instructor/payout-account' as const)}
                style={styles.changeAccountBtn}
              >
                <Text style={styles.changeAccountText}>Đổi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAccountBox}>
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text style={styles.noAccountText}>Chưa có tài khoản ngân hàng nhận tiền</Text>
              <Button
                title="Thiết lập ngay"
                variant="outline"
                style={styles.setupBtn}
                onPress={() => router.push('/instructor/payout-account' as const)}
              />
            </View>
          )}
        </View>

        {/* Amount Input Form */}
        <View style={styles.formCard}>
          <Text variant="label">Số tiền muốn rút (VNĐ)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.amountInput,
                (Boolean(clientError) || Boolean(serverError)) && styles.inputError,
              ]}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={rawAmount}
              onChangeText={handleAmountChange}
              editable={!isPending}
            />
            <Text style={styles.currencySuffix}>đ</Text>
          </View>

          {clientError && <Text style={styles.errorText}>{clientError}</Text>}

          {/* Quick Amount Chips */}
          <View style={styles.chipsRow}>
            {[500000, 1000000, 2000000].map((chipAmount) => {
              const disabled = chipAmount > availableBalance;
              return (
                <TouchableOpacity
                  key={chipAmount}
                  style={[styles.chip, disabled && styles.chipDisabled]}
                  disabled={disabled}
                  onPress={() => handleChipPress(chipAmount)}
                >
                  <Text style={[styles.chipText, disabled && styles.chipTextDisabled]}>
                    {(chipAmount / 1000).toLocaleString('vi-VN')}k
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.chip, availableBalance < minWithdrawal && styles.chipDisabled]}
              disabled={availableBalance < minWithdrawal}
              onPress={() => handleChipPress(availableBalance)}
            >
              <Text
                style={[
                  styles.chipText,
                  styles.chipAllText,
                  availableBalance < minWithdrawal && styles.chipTextDisabled,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <Button
            title={isPending ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút tiền'}
            onPress={handleSubmit}
            loading={isPending}
            disabled={
              isPending ||
              !hasPayoutAccount ||
              availableBalance < minWithdrawal ||
              !rawAmount
            }
            style={styles.submitBtn}
          />
        </View>

        {/* Policy explanation */}
        <View style={styles.policyNotice}>
          <Ionicons name="time-outline" size={18} color="#64748B" />
          <Text style={styles.policyText}>
            Yêu cầu rút tiền sau khi gửi sẽ ở trạng thái "Đang chờ xử lý" và được quản trị viên duyệt
            chuyển khoản trong vòng 1-3 ngày làm việc. Bạn có thể hủy yêu cầu khi chưa được duyệt.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34D399',
    marginVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  balanceHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  accountCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountMeta: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountNumber: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  changeAccountBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  changeAccountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  noAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  noAccountText: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
  },
  setupBtn: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  inputError: {
    borderColor: '#EF4444',
  },
  currencySuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontVariant: ['tabular-nums'],
  },
  chipTextDisabled: {
    color: '#94A3B8',
  },
  chipAllText: {
    color: '#0D9488',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    marginTop: 6,
  },
  policyNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});