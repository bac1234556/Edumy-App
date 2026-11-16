// src/lib/__tests__/date.test.ts
import { formatDate, formatDateTime } from '../date';

describe('date formatting (Asia/Ho_Chi_Minh)', () => {
  it('handles empty inputs safely', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('invalid')).toBe('');
  });

  it('formats UTC ISO-8601 into Vietnam date (dd/MM/yyyy)', () => {
    // 2026-11-16T17:00:00Z in UTC is 2026-11-17T00:00:00 in UTC+7 (boundary transition)
    const result = formatDate('2026-11-16T17:00:00Z');
    expect(result).toBe('17/11/2026');
  });

  it('formats UTC ISO-8601 into Vietnam dateTime (HH:mm dd/MM/yyyy)', () => {
    // 2026-11-16T07:05:00Z in UTC is 14:05 on 16/11/2026 in UTC+7
    const result = formatDateTime('2026-11-16T07:05:00Z');
    expect(result).toBe('14:05 16/11/2026');
  });

  it('correctly handles month boundary crossing in UTC vs Vietnam time', () => {
    // 2026-10-31T20:30:00Z (Oct 31 in UTC) is 2026-11-01 03:30 (Nov 1 in Vietnam)
    const dateStr = formatDate('2026-10-31T20:30:00Z');
    expect(dateStr).toBe('01/11/2026');
  });
});
