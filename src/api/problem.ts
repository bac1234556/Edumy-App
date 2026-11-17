// src/api/problem.ts
// Backend v2 error envelope normalization to AppError & react-hook-form helpers.

import { AxiosError } from 'axios';
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export interface V2ErrorDetails {
  code?: string;
  fields?: Record<string, string> | null;
  traceId?: string;
}

export interface V2ErrorBody {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: V2ErrorDetails | null;
  // Legacy / Spring default fallback fields
  detail?: string;
  traceId?: string;
}

export interface AppError {
  kind: 'problem' | 'network' | 'timeout' | 'unknown';
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  retryAfterSec?: number;
  traceId?: string;
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  401: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
  403: 'Bạn không có quyền thực hiện hành động này.',
  404: 'Không tìm thấy tài nguyên yêu cầu.',
  405: 'Phương thức yêu cầu không được hỗ trợ.',
  409: 'Dữ liệu bị trùng lặp hoặc xung đột trạng thái.',
  422: 'Dữ liệu gửi lên không đúng định dạng hoặc vi phạm quy tắc.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  500: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  502: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
  503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isAppError(err: unknown): err is AppError {
  return (
    isPlainObject(err) &&
    typeof err.kind === 'string' &&
    ['problem', 'network', 'timeout', 'unknown'].includes(err.kind) &&
    typeof err.message === 'string'
  );
}

export function parseAppError(error: unknown): AppError {
  if (!error) {
    return {
      kind: 'unknown',
      message: 'Đã có lỗi không xác định xảy ra.',
    };
  }

  if (isAppError(error)) {
    return error;
  }

  const axiosError = error as AxiosError<V2ErrorBody>;

  // 1. Timeout error
  if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
    return {
      kind: 'timeout',
      message: 'Yêu cầu đã quá thời gian chờ (15s). Vui lòng kiểm tra lại đường truyền mạng.',
    };
  }

  // 2. Network error (no response received)
  if (axiosError.isAxiosError && !axiosError.response) {
    return {
      kind: 'network',
      message: 'Không thể kết nối tới máy chủ Edumy. Vui lòng kiểm tra kết nối mạng của bạn.',
    };
  }

  // 3. Server HTTP error response (v2 envelope: { success: false, message, data: null, errors: { code, fields, traceId } })
  if (axiosError.response) {
    const status = axiosError.response.status;
    const rawData = axiosError.response.data;
    const data: V2ErrorBody = isPlainObject(rawData) ? (rawData as V2ErrorBody) : {};
    const headers = axiosError.response.headers || {};

    // Prioritize Vietnamese message from server v2 envelope
    let message =
      typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : typeof data.detail === 'string' && data.detail.trim().length > 0
          ? data.detail
          : '';
    if (!message) {
      message = DEFAULT_STATUS_MESSAGES[status] || 'Đã có lỗi xảy ra từ máy chủ.';
    }

    const errObj = isPlainObject(data.errors) ? (data.errors as V2ErrorDetails) : undefined;

    const code = typeof errObj?.code === 'string' ? errObj.code : undefined;
    const traceId =
      typeof errObj?.traceId === 'string'
        ? errObj.traceId
        : typeof data.traceId === 'string'
          ? data.traceId
          : undefined;

    // Extract field errors strictly from errors.fields (never pull code or traceId)
    const fieldErrors: Record<string, string> = {};
    if (isPlainObject(errObj?.fields)) {
      for (const [k, v] of Object.entries(errObj.fields)) {
        if (typeof v === 'string') {
          fieldErrors[k] = v;
        }
      }
    }

    // Extract Retry-After header for 429
    let retryAfterSec: number | undefined;
    const retryHeader = headers['retry-after'] || headers['Retry-After'];
    if (retryHeader !== undefined) {
      const parsed = parseInt(String(retryHeader), 10);
      if (!isNaN(parsed) && parsed > 0) {
        retryAfterSec = parsed;
      }
    }

    return {
      kind: 'problem',
      status,
      code,
      message,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      retryAfterSec,
      traceId,
    };
  }

  // 4. General JavaScript Error
  if (error instanceof Error) {
    return {
      kind: 'unknown',
      message: error.message || 'Đã có lỗi xảy ra.',
    };
  }

  return {
    kind: 'unknown',
    message: String(error),
  };
}

/**
 * Utility to map fieldErrors from AppError to react-hook-form setError.
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors?: Record<string, string>
): void {
  if (!fieldErrors) return;
  for (const [field, message] of Object.entries(fieldErrors)) {
    setError(field as Path<T>, {
      type: 'server',
      message,
    });
  }
}
