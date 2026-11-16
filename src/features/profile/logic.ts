// src/features/profile/logic.ts
// Pure logic for profile, roles and instructor money mode tab visibility (D-M01, rules 40).

import { UserProfile } from '../auth/api';
import { z } from 'zod';
import { passwordSchema } from '../auth/logic';

export interface EarningsSummaryCheck {
  hasEarnings?: boolean;
}

/**
 * Pure function to evaluate whether the Instructor tab should be visible (D-M01).
 * Condition: user has 'instructor' role OR has recorded earnings (even if role was revoked, BR-53).
 */
export function shouldShowInstructorTab(
  me?: UserProfile | null,
  earningsSummary?: EarningsSummaryCheck | null
): boolean {
  if (!me) return false;

  const hasInstructorRole = Boolean(
    me.roles &&
      me.roles.some((r) => typeof r === 'string' && r.toLowerCase() === 'instructor')
  );

  const hasRecordedEarnings = Boolean(earningsSummary?.hasEarnings);

  return hasInstructorRole || hasRecordedEarnings;
}

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
