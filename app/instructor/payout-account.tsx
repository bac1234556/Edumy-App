// app/instructor/payout-account.tsx — Quản lý tài khoản nhận tiền giảng viên (M09, BR-52, BR-54)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '../../src/lib/dialog';
import {
  usePayoutAccount,
  useUpdatePayoutAccount,
} from '../../src/features/instructor/hooks';
import {
  payoutAccountSchema,
  PayoutAccountFormData,
  maskAccountNumber,
} from '../../src/features/instructor/logic';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AppError, applyFieldErrors } from '../../src/api/problem';
import { formatDateTime } from '../../src/lib/date';
import { layout, monoFontFamily, radius, semantic } from '../../src/theme/tokens';

export default function PayoutAccountScreen() {
  const { data: account, isLoading, isError, error, refetch, isRefetching } = usePayoutAccount();
  const { mutate: updateAccount, isPending } = useUpdatePayoutAccount();

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PayoutAccountFormData>({
    resolver: zodResolver(payoutAccountSchema),
    defaultValues: {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      currentPassword: '',
    },
  });

  const handleStartEdit = () => {
    reset({
      bankName: account?.bankName || '',
      accountNumber: '',
      accountHolder: account?.accountHolder || '',
      currentPassword: '',
    });
    setServerError(null);
    setIsEditing(true);
  };

  const onSubmit = (data: PayoutAccountFormData) => {
    setServerError(null);
    updateAccount(
      {
        bankName: data.bankName.trim(),
        accountNumber: data.accountNumber.trim(),
        accountHolder: data.accountHolder.trim().toUpperCase(),
        currentPassword: data.currentPassword,
      },
      {
        onSuccess: () => {
          reset({
            bankName: '',
            accountNumber: '',
            accountHolder: '',
            currentPassword: '',
          });
          setIsEditing(false);
          void notify('Thành công', 'Thông tin tài khoản nhận tiền đã được lưu an toàn.');
        },
        onError: (err) => {
          setValue('currentPassword', '');
          const appErr = err as unknown as AppError;
          if (
            appErr.code === 'CURRENT_PASSWORD_INCORRECT' ||
            appErr.code === 'PASSWORD_INCORRECT' ||
            appErr.status === 422
          ) {
            setError('currentPassword', {
              message: appErr.message || 'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.',
            });
          } else {
            applyFieldErrors(setError, appErr.fieldErrors);
            setServerError(appErr.message || 'Không thể cập nhật tài khoản nhận tiền.');
          }
        },
      }
    );
  };

  if (isLoading) {
    return <Loading message="Đang tải thông tin tài khoản..." />;
  }

  // A 404 is treated as unset account, not an error
  const appErr = error as unknown as AppError;
  const isActualError = isError && appErr?.status !== 404;

  if (isActualError) {
    return (
      <ErrorState
        error={error}
        message={appErr?.message || 'Không thể tải thông tin tài khoản nhận tiền.'}
        onRetry={refetch}
      />
    );
  }

  const hasExistingAccount = Boolean(account && account.accountNumberLast4);
  const showForm = !hasExistingAccount || isEditing;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Tài khoản nhận tiền', headerBackTitle: 'Quay lại' }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ResponsiveContainer maxWidth={layout.maxReadingWidth}>
          {serverError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={semantic.danger} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Existing Account Card */}
          {hasExistingAccount && account && !isEditing && (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.bankIconWrapper}>
                  <Ionicons name="business-outline" size={22} color={semantic.brandPrimary} />
                </View>
                <View style={styles.cardHeaderMeta}>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <Text style={styles.accountHolder}>{account.accountHolder}</Text>
                </View>
              </View>

              <View style={styles.accountNumberRow}>
                <Text style={styles.maskedNumberLabel}>Số tài khoản</Text>
                <Text style={styles.maskedNumber}>
                  {maskAccountNumber(account.accountNumberLast4)}
                </Text>
              </View>

              {Boolean(account.updatedAt) && (
                <Text style={styles.updatedAtText}>
                  Cập nhật lần cuối: {formatDateTime(account.updatedAt)}
                </Text>
              )}

              <Button
                title="Thay đổi tài khoản"
                variant="outline"
                onPress={handleStartEdit}
              />
            </Card>
          )}

          {/* Form View (For creating new or editing) */}
          {showForm && (
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={semantic.brandPrimary}
                />
                <Text style={styles.formTitle}>
                  {hasExistingAccount
                    ? 'Cập nhật tài khoản nhận tiền'
                    : 'Thiết lập tài khoản nhận tiền'}
                </Text>
              </View>

              <Text style={styles.securityNotice}>
                Để đảm bảo an toàn doanh thu, mọi thay đổi tài khoản ngân hàng đều yêu cầu xác thực
                bằng mật khẩu hiện tại của bạn.
              </Text>

              <View style={styles.formFields}>
                <Controller
                  control={control}
                  name="bankName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Tên ngân hàng"
                      placeholder="Ví dụ: Vietcombank, Techcombank, MB..."
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.bankName?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="accountNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Số tài khoản ngân hàng"
                      placeholder="Nhập số tài khoản ngân hàng"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.accountNumber?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="accountHolder"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Tên chủ tài khoản (viết hoa không dấu)"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      autoCapitalize="characters"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.accountHolder?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Mật khẩu hiện tại (để xác thực)"
                      placeholder="Nhập mật khẩu hiện tại"
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.currentPassword?.message}
                      rightAdornment={
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                          accessibilityRole="button"
                          accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={semantic.textMuted}
                          />
                        </TouchableOpacity>
                      }
                    />
                  )}
                />

                <View style={styles.buttonRow}>
                  {hasExistingAccount && (
                    <Button
                      title="Hủy"
                      variant="outline"
                      onPress={() => setIsEditing(false)}
                      disabled={isPending}
                      style={styles.cancelBtn}
                    />
                  )}
                  <Button
                    title={isPending ? 'Đang lưu...' : 'Lưu tài khoản'}
                    onPress={handleSubmit(onSubmit)}
                    loading={isPending}
                    disabled={isPending}
                    style={styles.submitBtn}
                  />
                </View>
              </View>
            </Card>
          )}

          {/* Security Advice Notice */}
          <View style={styles.policyNotice}>
            <Ionicons name="information-circle-outline" size={18} color={semantic.textMuted} />
            <Text style={styles.policyText}>
              Hệ thống chỉ lưu trữ và hiển thị 4 chữ số cuối của tài khoản ngân hàng để bảo đảm
              tuyệt đối quyền riêng tư và an toàn tài chính của giảng viên.
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
  card: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bankIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderMeta: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  accountHolder: {
    fontSize: 13,
    color: semantic.textSecondary,
    marginTop: 2,
  },
  accountNumberRow: {
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.btn,
    padding: 14,
    marginBottom: 12,
  },
  maskedNumberLabel: {
    fontSize: 11,
    color: semantic.textMuted,
    marginBottom: 4,
  },
  maskedNumber: {
    fontFamily: monoFontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  updatedAtText: {
    fontSize: 12,
    color: semantic.textMuted,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  formCard: {
    marginBottom: 14,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  securityNotice: {
    fontSize: 13,
    color: semantic.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  formFields: {
    gap: 14,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
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
