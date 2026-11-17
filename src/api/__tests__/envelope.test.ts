// src/api/__tests__/envelope.test.ts
import { unwrap } from '../envelope';

describe('unwrap', () => {
  it('unwraps standard v2 success envelope', () => {
    const payload = {
      success: true,
      message: 'OK',
      data: { id: 1, fullName: 'Nguyễn Văn A' },
      errors: null,
    };
    expect(unwrap(payload)).toEqual({ id: 1, fullName: 'Nguyễn Văn A' });
  });

  it('preserves falsy valid data values (null, 0, false, empty string)', () => {
    expect(unwrap({ success: true, message: 'OK', data: null, errors: null })).toBeNull();
    expect(unwrap({ success: true, message: 'OK', data: 0, errors: null })).toBe(0);
    expect(unwrap({ success: true, message: 'OK', data: false, errors: null })).toBe(false);
    expect(unwrap({ success: true, message: 'OK', data: '', errors: null })).toBe('');
  });

  it('returns raw body when response is not an envelope', () => {
    const raw = { accessToken: 'abc', refreshToken: 'xyz' };
    expect(unwrap(raw)).toEqual(raw);
    expect(unwrap([1, 2, 3])).toEqual([1, 2, 3]);
    expect(unwrap(null)).toBeNull();
  });
});
