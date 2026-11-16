// src/features/instructor/__tests__/logic.test.ts
// Unit tests for Instructor Logic (M08, M09, Phân hệ 06)

import {
  validateWithdrawalAmount,
  getWithdrawalStatusInfo,
  getMaturityExplanation,
  maskAccountNumber,
  payoutAccountSchema,
} from '../logic';

describe('Instructor Logic & Money Mode (Phân hệ 06, Rules 40)', () => {
  describe('validateWithdrawalAmount', () => {
    const availableBalance = 2000000;
    const minWithdrawal = 100000;

    it('rejects invalid numbers, zero and negative amounts', () => {
      expect(validateWithdrawalAmount(NaN, availableBalance).valid).toBe(false);
      expect(validateWithdrawalAmount(0, availableBalance).valid).toBe(false);
      expect(validateWithdrawalAmount(-50000, availableBalance).valid).toBe(false);
    });

    it('rejects fractional VND amounts (must be integer)', () => {
      const res = validateWithdrawalAmount(150000.5, availableBalance);
      expect(res.valid).toBe(false);
      expect(res.message).toContain('số nguyên VNĐ');
    });

    it('rejects amount below minWithdrawal', () => {
      const res = validateWithdrawalAmount(50000, availableBalance, minWithdrawal);
      expect(res.valid).toBe(false);
      expect(res.message).toContain('tối thiểu');
    });

    it('rejects amount exceeding available balance', () => {
      const res = validateWithdrawalAmount(2500000, availableBalance, minWithdrawal);
      expect(res.valid).toBe(false);
      expect(res.message).toContain('vượt quá số dư khả dụng');
    });

    it('accepts valid withdrawal amount within balance', () => {
      const res = validateWithdrawalAmount(500000, availableBalance, minWithdrawal);
      expect(res.valid).toBe(true);
      expect(res.message).toBeUndefined();
    });

    it('accepts exactly minWithdrawal and exactly availableBalance', () => {
      expect(validateWithdrawalAmount(minWithdrawal, availableBalance, minWithdrawal).valid).toBe(
        true
      );
      expect(
        validateWithdrawalAmount(availableBalance, availableBalance, minWithdrawal).valid
      ).toBe(true);
    });
  });

  describe('getWithdrawalStatusInfo', () => {
    it('returns proper labels and colors for all 4 states', () => {
      const req = getWithdrawalStatusInfo('requested');
      expect(req.label).toBe('Đang chờ xử lý');
      expect(req.color).toBe('#D97706');

      const paid = getWithdrawalStatusInfo('paid');
      expect(paid.label).toBe('Đã chuyển khoản');
      expect(paid.color).toBe('#059669');

      const rej = getWithdrawalStatusInfo('rejected');
      expect(rej.label).toBe('Bị từ chối');
      expect(rej.color).toBe('#DC2626');

      const can = getWithdrawalStatusInfo('cancelled');
      expect(can.label).toBe('Đã hủy');
      expect(can.color).toBe('#64748B');
    });

    it('falls back gracefully on unknown status', () => {
      const unknown = getWithdrawalStatusInfo('unknown_status');
      expect(unknown.label).toBe('unknown_status');
    });
  });

  describe('getMaturityExplanation', () => {
    it('explains demo immediate policy', () => {
      expect(getMaturityExplanation('immediate')).toContain('Chế độ demo: thu nhập khả dụng ngay');
    });

    it('explains standard monthly policy', () => {
      expect(getMaturityExplanation('monthly')).toContain('ngày 01 của tháng kế tiếp');
      expect(getMaturityExplanation()).toContain('ngày 01 của tháng kế tiếp');
    });
  });

  describe('maskAccountNumber', () => {
    it('masks full number and displays only last 4 digits', () => {
      expect(maskAccountNumber('1234')).toBe('•••• •••• •••• 1234');
    });

    it('handles empty or undefined safely', () => {
      expect(maskAccountNumber('')).toBe('••••');
      expect(maskAccountNumber(undefined)).toBe('••••');
    });
  });

  describe('payoutAccountSchema', () => {
    it('validates valid payout account input', () => {
      const res = payoutAccountSchema.safeParse({
        bankName: 'Vietcombank',
        accountNumber: '0123456789',
        accountHolder: 'NGUYEN VAN A',
        currentPassword: 'MySecretPassword123',
      });
      expect(res.success).toBe(true);
    });

    it('rejects invalid or too short account numbers', () => {
      const res1 = payoutAccountSchema.safeParse({
        bankName: 'Vietcombank',
        accountNumber: '123',
        accountHolder: 'NGUYEN VAN A',
        currentPassword: 'MySecretPassword123',
      });
      expect(res1.success).toBe(false);

      const res2 = payoutAccountSchema.safeParse({
        bankName: 'Vietcombank',
        accountNumber: '12345ABCDE',
        accountHolder: 'NGUYEN VAN A',
        currentPassword: 'MySecretPassword123',
      });
      expect(res2.success).toBe(false);
    });

    it('requires current password for authentication', () => {
      const res = payoutAccountSchema.safeParse({
        bankName: 'Vietcombank',
        accountNumber: '0123456789',
        accountHolder: 'NGUYEN VAN A',
        currentPassword: '',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('mật khẩu');
      }
    });
  });
});