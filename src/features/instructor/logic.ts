// src/features/instructor/logic.ts
// Pure business logic, validation and formatters for Instructor Money Mode (Phân hệ 06, Rules 40).

import { z } from 'zod';

export interface WithdrawalStatusInfo {
  label: string;
  color: string;
  backgroundColor: string;
}

export function getWithdrawalStatusInfo(status: string): WithdrawalStatusInfo {
  switch (status?.toLowerCase()) {
    case 'requested':
      return {
        label: 'Đang chờ xử lý',
        color: '#D97706',
        backgroundColor: '#FEF3C7',
      };
    case 'paid':
      return {
        label: 'Đã chuyển khoản',
        color: '#059669',
        backgroundColor: '#D1FAE5',
      };
    case 'rejected':
      return {
        label: 'Bị từ chối',
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
      };
    case 'cancelled':
      return {
        label: 'Đã hủy',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
      };
    default:
      return {
        label: status || 'Không rõ',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
      };
  }
}

export interface WithdrawalValidationResult {
  valid: boolean;
  message?: string;
}

export function validateWithdrawalAmount(
  amount: number,
  availableBalance: number,
  minWithdrawal: number = 100000
): WithdrawalValidationResult {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Vui lòng nhập số tiền hợp lệ.' };
  }

  if (Math.floor(amount) !== amount) {
    return { valid: false, message: 'Số tiền rút phải là số nguyên VNĐ.' };
  }

  if (amount < minWithdrawal) {
    return {
      valid: false,
      message: `Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString('vi-VN')} đ.`,
    };
  }

  if (amount > availableBalance) {
    return {
      valid: false,
      message: `Số tiền rút vượt quá số dư khả dụng (${availableBalance.toLocaleString('vi-VN')} đ).`,
    };
  }

  return { valid: true };
}

export function getMaturityExplanation(policy?: string): string {
  if (policy === 'immediate') {
    return 'Chế độ demo: thu nhập khả dụng ngay.';
  }
  return 'Thu nhập phát sinh trong tháng M sẽ khả dụng để rút từ ngày 01 của tháng kế tiếp (theo giờ Việt Nam).';
}

export function maskAccountNumber(last4?: string): string {
  if (!last4) return '••••';
  return `•••• •••• •••• ${last4}`;
}

export const payoutAccountSchema = z.object({
  bankName: z.string().min(2, 'Vui lòng nhập tên ngân hàng'),
  accountNumber: z
    .string()
    .min(6, 'Số tài khoản phải có từ 6 chữ số trở lên')
    .regex(/^[0-9]+$/, 'Số tài khoản chỉ bao gồm các chữ số'),
  accountHolder: z.string().min(2, 'Vui lòng nhập tên chủ tài khoản'),
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại để xác thực'),
});

export type PayoutAccountFormData = z.infer<typeof payoutAccountSchema>;
