// src/api/__tests__/problem.test.ts
import { parseAppError, applyFieldErrors } from '../problem';
import { AxiosError, AxiosResponse } from 'axios';

describe('parseAppError (v2 envelope)', () => {
  it('parses AUTH_INVALID_CREDENTIALS (401) without polluting fieldErrors with code/traceId', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 401,
        headers: {},
        data: {
          success: false,
          message: 'Email hoặc mật khẩu không đúng.',
          data: null,
          errors: {
            code: 'AUTH_INVALID_CREDENTIALS',
            fields: null,
            traceId: '9f8a7b6c-1234-4567-890a-bcdef0123456',
          },
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed).toEqual({
      kind: 'problem',
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Email hoặc mật khẩu không đúng.',
      fieldErrors: undefined,
      retryAfterSec: undefined,
      traceId: '9f8a7b6c-1234-4567-890a-bcdef0123456',
    });
  });

  it('parses VALIDATION_ERROR (400) with errors.fields', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        headers: {},
        data: {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ.',
          data: null,
          errors: {
            code: 'VALIDATION_ERROR',
            fields: {
              email: 'Email không đúng định dạng',
              password: 'Mật khẩu phải từ 8 ký tự trở lên',
            },
            traceId: 'trace-val-001',
          },
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(400);
    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.message).toBe('Dữ liệu đầu vào không hợp lệ.');
    expect(parsed.traceId).toBe('trace-val-001');
    expect(parsed.fieldErrors).toEqual({
      email: 'Email không đúng định dạng',
      password: 'Mật khẩu phải từ 8 ký tự trở lên',
    });
  });

  it('parses WITHDRAWAL_EXCEEDS_BALANCE (422) from v2 envelope', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 422,
        headers: {},
        data: {
          success: false,
          message: 'Số tiền rút vượt quá số dư khả dụng.',
          data: null,
          errors: {
            code: 'WITHDRAWAL_EXCEEDS_BALANCE',
            fields: null,
            traceId: 'trace-wd-422',
          },
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(422);
    expect(parsed.code).toBe('WITHDRAWAL_EXCEEDS_BALANCE');
    expect(parsed.message).toBe('Số tiền rút vượt quá số dư khả dụng.');
    expect(parsed.fieldErrors).toBeUndefined();
    expect(parsed.traceId).toBe('trace-wd-422');
  });

  it('parses 500 INTERNAL_ERROR from v2 envelope and falls back on empty body', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 500,
        headers: {},
        data: {
          success: false,
          message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
          data: null,
          errors: {
            code: 'INTERNAL_ERROR',
            fields: null,
            traceId: 'trace-500-xyz',
          },
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(500);
    expect(parsed.code).toBe('INTERNAL_ERROR');
    expect(parsed.message).toBe('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
    expect(parsed.traceId).toBe('trace-500-xyz');

    const empty500 = parseAppError({
      isAxiosError: true,
      response: { status: 500, headers: {}, data: {} } as unknown as AxiosResponse,
    });
    expect(empty500.message).toBe('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
  });

  it('reads Retry-After header for 429 status', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 429,
        headers: {
          'retry-after': '58',
        },
        data: {
          success: false,
          message: 'Vui lòng chờ 58 giây trước khi gửi lại email xác thực.',
          data: null,
          errors: {
            code: 'EMAIL_RESEND_TOO_SOON',
            fields: null,
            traceId: 'trace-429',
          },
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    const parsed = parseAppError(error);
    expect(parsed.kind).toBe('problem');
    expect(parsed.status).toBe(429);
    expect(parsed.code).toBe('EMAIL_RESEND_TOO_SOON');
    expect(parsed.retryAfterSec).toBe(58);
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
