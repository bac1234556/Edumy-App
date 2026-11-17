// src/features/instructor/logic.ts
// Pure business logic, BR-PAY-HOLD formatters, validation & labels for Instructor Channel.

import { z } from 'zod';
import { formatDateTimeDmY } from '../../lib/date';
import { AppError } from '../../api/problem';

export interface WithdrawalStatusInfo {
  label: string;
  color: string;
  backgroundColor: string;
}

export function getWithdrawalStatusInfo(status: string): WithdrawalStatusInfo {
  switch (status?.toLowerCase()) {
    case 'requested':
      return {
        label: 'Đang chờ duyệt',
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

export interface CourseStatusInfo {
  label: string;
  color: string;
  backgroundColor: string;
}

export function getCourseStatusInfo(status?: string): CourseStatusInfo {
  switch (status?.toLowerCase()) {
    case 'published':
      return { label: 'Đã xuất bản', color: '#059669', backgroundColor: '#D1FAE5' };
    case 'pendingapproval':
    case 'pending_approval':
    case 'pending':
      return { label: 'Chờ duyệt', color: '#D97706', backgroundColor: '#FEF3C7' };
    case 'draft':
      return { label: 'Bản nháp', color: '#475569', backgroundColor: '#F1F5F9' };
    case 'hidden':
      return { label: 'Đang ẩn', color: '#64748B', backgroundColor: '#E2E8F0' };
    case 'rejected':
      return { label: 'Bị từ chối', color: '#DC2626', backgroundColor: '#FEE2E2' };
    default:
      return { label: status || 'Không rõ', color: '#64748B', backgroundColor: '#F1F5F9' };
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

/**
 * BR-PAY-HOLD rolling hold explanation driven strictly by server holdDays.
 */
export function formatHoldDaysExplanation(holdDays?: number | null): string {
  const days = holdDays ?? 0;
  if (days === 0) {
    return 'Thu nhập khả dụng ngay sau khi đơn hàng được thanh toán (chế độ demo)';
  }
  return `Mỗi khoản thu nhập khả dụng sau ${days} ngày kể từ khi đơn hàng được thanh toán`;
}

export function formatNextMaturityLine(nextMaturityAt?: string | null): string | null {
  if (!nextMaturityAt) return null;
  const formatted = formatDateTimeDmY(nextMaturityAt);
  if (!formatted) return null;
  return `Khoản tiếp theo khả dụng lúc ${formatted}`;
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

export type WithdrawalErrorResolution =
  | { action: 'confirm_payout_account'; message: string }
  | { action: 'go_withdrawals_list'; message: string }
  | { action: 'amount_field_error'; message: string }
  | { action: 'banner_error'; message: string };

export function resolveWithdrawalErrorAction(
  appError: Pick<AppError, 'code' | 'message'>,
  minWithdrawal: number = 100000
): WithdrawalErrorResolution {
  switch (appError.code) {
    case 'PAYOUT_ACCOUNT_REQUIRED':
      return {
        action: 'confirm_payout_account',
        message:
          appError.message ||
          'Bạn cần thiết lập tài khoản ngân hàng nhận tiền trước khi tạo yêu cầu rút.',
      };
    case 'WITHDRAWAL_ALREADY_OPEN':
      return {
        action: 'go_withdrawals_list',
        message:
          appError.message ||
          'Bạn đang có một yêu cầu rút tiền đang chờ duyệt. Vui lòng kiểm tra danh sách yêu cầu.',
      };
    case 'WITHDRAWAL_EXCEEDS_BALANCE':
      return {
        action: 'amount_field_error',
        message: appError.message || 'Số tiền yêu cầu vượt quá số dư khả dụng hiện có.',
      };
    case 'WITHDRAWAL_BELOW_MINIMUM':
      return {
        action: 'amount_field_error',
        message:
          appError.message ||
          `Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString('vi-VN')} đ.`,
      };
    default:
      return {
        action: 'banner_error',
        message: appError.message || 'Không thể tạo yêu cầu rút tiền.',
      };
  }
}
