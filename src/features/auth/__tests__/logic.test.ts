// src/features/auth/__tests__/logic.test.ts
import {
  passwordSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from '../logic';

describe('Auth Validation Schemas (Rules 30)', () => {
  describe('passwordSchema', () => {
    it('accepts valid passwords (>=8 chars, contains letter and digit)', () => {
      expect(passwordSchema.safeParse('Password123').success).toBe(true);
      expect(passwordSchema.safeParse('Secret2026').success).toBe(true);
      expect(passwordSchema.safeParse('a1b2c3d4e5').success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = passwordSchema.safeParse('Pass1');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('từ 8 ký tự trở lên');
      }
    });

    it('rejects passwords without digits', () => {
      const res = passwordSchema.safeParse('PasswordOnly');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('ít nhất một chữ số');
      }
    });

    it('rejects passwords without letters', () => {
      const res = passwordSchema.safeParse('123456789');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('ít nhất một chữ cái');
      }
    });
  });

  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const res = loginSchema.safeParse({
        email: 'student@edumy.com',
        password: 'Password123!',
      });
      expect(res.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const res = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const res = registerSchema.safeParse({
        fullName: 'Nguyễn Văn A',
        email: 'student@edumy.com',
        password: 'Password123!',
      });
      expect(res.success).toBe(true);
    });

    it('rejects empty fullName', () => {
      const res = registerSchema.safeParse({
        fullName: '',
        email: 'student@edumy.com',
        password: 'Password123!',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates email format', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'user@test.com' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    });
  });
});
