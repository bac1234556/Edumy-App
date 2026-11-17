// app/instructor/payout-account.tsx — Quản lý tài khoản nhận tiền giảng viên (M09, BR-52, BR-54)
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { notify } from '../../src/lib/dialog';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
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
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { AppError, applyFieldErrors } from '../../src/api/problem';
import { formatDateTime } from '../../src/lib/date';

export default function PayoutAccountScreen() {
  const router = useRouter();
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
          // Never keep bank number or password in state after submit
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
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
            Tài khoản nhận tiền
          </Text>
        </View>

        {serverError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Existing Account Card */}
        {hasExistingAccount && account && !isEditing && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.bankIconWrapper}>
                <Ionicons name="business-outline" size={24} color="#0D9488" />
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

            {account.updatedAt && (
              <Text style={styles.updatedAtText}>
                Cập nhật lần cuối: {formatDateTime(account.updatedAt)}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Button
                title="Thay đổi tài khoản"
                variant="outline"
                onPress={handleStartEdit}
                style={styles.editBtn}
              />
            </View>
          </View>
        )}

        {/* Form View (For creating new or editing) */}
        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0D9488" />
              <Text style={styles.formTitle}>
                {hasExistingAccount ? 'Cập nhật tài khoản nhận tiền' : 'Thiết lập tài khoản nhận tiền'}
              </Text>
            </View>

            <Text style={styles.securityNotice}>
              Để đảm bảo an toàn doanh thu, mọi thay đổi tài khoản ngân hàng đều yêu cầu xác thực bằng
              mật khẩu hiện tại của bạn.
            </Text>

            {/* Bank Name */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Tên ngân hàng</Text>
              <Controller
                control={control}
                name="bankName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.bankName && styles.inputError]}
                    placeholder="Ví dụ: Vietcombank, Techcombank, MB..."
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.bankName && (
                <Text style={styles.fieldError}>{errors.bankName.message}</Text>
              )}
            </View>

            {/* Account Number */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Số tài khoản ngân hàng</Text>
              <Controller
                control={control}
                name="accountNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.accountNumber && styles.inputError]}
                    placeholder="Nhập số tài khoản ngân hàng"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.accountNumber && (
                <Text style={styles.fieldError}>{errors.accountNumber.message}</Text>
              )}
            </View>

            {/* Account Holder */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Tên chủ tài khoản (viết hoa không dấu)</Text>
              <Controller
                control={control}
                name="accountHolder"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.accountHolder && styles.inputError]}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.accountHolder && (
                <Text style={styles.fieldError}>{errors.accountHolder.message}</Text>
              )}
            </View>

            {/* Current Password Verification */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Mật khẩu hiện tại (để xác thực)</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.currentPassword && styles.inputError,
                      ]}
                      placeholder="Nhập mật khẩu hiện tại"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel="Ẩn hoặc hiện mật khẩu"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.fieldError}>{errors.currentPassword.message}</Text>
              )}
            </View>

            {/* Buttons */}
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
        )}

        {/* Security Advice Notice */}
        <View style={styles.policyNotice}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.policyText}>
            Hệ thống chỉ lưu trữ và hiển thị 4 chữ số cuối của tài khoản ngân hàng để bảo đảm tuyệt
            đối quyền riêng tư và an toàn tài chính của giảng viên.
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bankIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderMeta: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountHolder: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  accountNumberRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  maskedNumberLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  maskedNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  updatedAtText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 14,
  },
  actionRow: {
    marginTop: 4,
  },
  editBtn: {
    borderColor: '#CBD5E1',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  securityNotice: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 6,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordWrapper: {
    position: 'relative',
    marginTop: 6,
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  fieldError: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    borderColor: '#CBD5E1',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#0D9488',
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