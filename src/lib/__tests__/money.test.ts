// src/lib/__tests__/money.test.ts
import { formatVnd } from '../money';

describe('formatVnd', () => {
  it('formats null or undefined as 0 đ', () => {
    expect(formatVnd(null)).toBe('0 đ');
    expect(formatVnd(undefined)).toBe('0 đ');
  });

  it('formats 0 as Miễn phí', () => {
    expect(formatVnd(0)).toBe('Miễn phí');
  });

  it('formats integer amounts with dot thousands separators', () => {
    expect(formatVnd(499000)).toBe('499.000 đ');
    expect(formatVnd(1500000)).toBe('1.500.000 đ');
    expect(formatVnd(50000)).toBe('50.000 đ');
  });

  it('rounds floating point amounts', () => {
    expect(formatVnd(499000.4)).toBe('499.000 đ');
    expect(formatVnd(499000.6)).toBe('499.001 đ');
  });
});
