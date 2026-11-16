// src/features/profile/__tests__/logic.test.ts
import {
  shouldShowInstructorTab,
  updateProfileSchema,
  changePasswordSchema,
} from '../logic';
import { UserProfile } from '../../auth/api';

describe('Profile Logic & Instructor Tab Visibility (D-M01, rules 40)', () => {
  const baseStudent: UserProfile = {
    id: 1,
    email: 'student@edumy.com',
    fullName: 'Nguyen Van A',
    emailVerified: true,
    roles: ['student'],
    createdAt: '2026-11-17T00:00:00Z',
  };

  it('returns false when user is not logged in', () => {
    expect(shouldShowInstructorTab(null)).toBe(false);
    expect(shouldShowInstructorTab(undefined)).toBe(false);
  });

  it('returns false for normal student without earnings', () => {
    expect(shouldShowInstructorTab(baseStudent)).toBe(false);
    expect(shouldShowInstructorTab(baseStudent, { hasEarnings: false })).toBe(false);
  });

  it('returns true when user has instructor role', () => {
    const instructorUser: UserProfile = {
      ...baseStudent,
      roles: ['instructor'],
    };
    expect(shouldShowInstructorTab(instructorUser)).toBe(true);

    const mixedRoles: UserProfile = {
      ...baseStudent,
      roles: ['student', 'INSTRUCTOR'],
    };
    expect(shouldShowInstructorTab(mixedRoles)).toBe(true);
  });

  it('returns true when user has recorded earnings even if role is only student (BR-53)', () => {
    expect(shouldShowInstructorTab(baseStudent, { hasEarnings: true })).toBe(true);
  });

  describe('updateProfileSchema', () => {
    it('validates valid fullName', () => {
      expect(updateProfileSchema.safeParse({ fullName: 'Le Van C' }).success).toBe(true);
    });

    it('rejects empty fullName', () => {
      const res = updateProfileSchema.safeParse({ fullName: '' });
      expect(res.success).toBe(false);
    });

    it('rejects fullName exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      const res = updateProfileSchema.safeParse({ fullName: longName });
      expect(res.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('validates correct password change', () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: 'Password123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      });
      expect(res.success).toBe(true);
    });

    it('rejects new password that is identical to current password', () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: 'Password123',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('không được trùng');
      }
    });

    it('rejects mismatched confirmation password', () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: 'Password123',
        newPassword: 'NewPassword456',
        confirmPassword: 'DifferentPassword789',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('không khớp');
      }
    });
  });
});
