// src/api/__tests__/problem.test.ts
import { parseAppError, applyFieldErrors } from '../problem';
import { AxiosError, AxiosResponse } from 'axios';

describe('parseAppError', () => {
  it('parses RFC 9457 ProblemDetail with errors array', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        headers: {},
        data: {
          type: 'https://edumy.com/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Dữ liệu không hợp lệ',
          code: 'VALIDATION_FAILED',
          traceId: 'trace-12345',
          errors: [
            { field: 'email', message: 'Email đã tồn tại' },
            { field: 'password', message: 'Mật khẩu quá ngắn' },
          ],
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(400);
    expect(parsed.code).toBe('VALIDATION_FAILED');
    expect(parsed.message).toBe('Dữ liệu không hợp lệ');
    expect(parsed.traceId).toBe('trace-12345');
    expect(parsed.fieldErrors).toEqual({
      email: 'Email đã tồn tại',
      password: 'Mật khẩu quá ngắn',
    });
  });

  it('parses ProblemDetail without errors array and uses default Vietnamese status message if detail is missing', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 404,
        headers: {},
        data: {},
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(404);
    expect(parsed.message).toBe('Không tìm thấy tài nguyên yêu cầu.');
  });

  it('reads Retry-After header for 429 status', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 429,
        headers: {
          'retry-after': '60',
        },
        data: {
          detail: 'Bạn đã thử quá nhiều lần.',
          code: 'RATE_LIMITED',
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(429);
    expect(parsed.code).toBe('RATE_LIMITED');
    expect(parsed.retryAfterSec).toBe(60);
  });

  it('handles timeout error correctly', () => {
    const error = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
    } as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('timeout');
    expect(parsed.message).toContain('quá thời gian chờ (15s)');
  });

  it('handles network error (offline) correctly', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
    } as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('network');
    expect(parsed.message).toContain('Không thể kết nối tới máy chủ Edumy');
  });
});

describe('applyFieldErrors', () => {
  it('calls setError for each field in fieldErrors', () => {
    const mockSetError = jest.fn();
    applyFieldErrors(mockSetError, {
      email: 'Email không hợp lệ',
      fullName: 'Họ tên quá dài',
    });

    expect(mockSetError).toHaveBeenCalledTimes(2);
    expect(mockSetError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Email không hợp lệ',
    });
    expect(mockSetError).toHaveBeenCalledWith('fullName', {
      type: 'server',
      message: 'Họ tên quá dài',
    });
  });

  it('does nothing when fieldErrors is undefined', () => {
    const mockSetError = jest.fn();
    applyFieldErrors(mockSetError, undefined);
    expect(mockSetError).not.toHaveBeenCalled();
  });
});
