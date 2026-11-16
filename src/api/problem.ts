// src/api/problem.ts
// RFC 9457 ProblemDetail to AppError normalization & form error helpers.

import { AxiosError } from 'axios';
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export interface FieldErrorItem {
  field?: string;
  message?: string;
}

export interface ProblemDetailResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: FieldErrorItem[] | Record<string, string>;
  message?: string;
  error?: unknown;
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
  409: 'Dữ liệu bị trùng lặp hoặc xung đột trạng thái.',
  422: 'Dữ liệu gửi lên không đúng định dạng hoặc vi phạm quy tắc.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  500: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  502: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
  503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
};

export function parseAppError(error: unknown): AppError {
  if (!error) {
    return {
      kind: 'unknown',
      message: 'Đã có lỗi không xác định xảy ra.',
    };
  }

  const axiosError = error as AxiosError<ProblemDetailResponse>;

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

  // 3. Server HTTP error response
  if (axiosError.response) {
    const status = axiosError.response.status;
    const data = axiosError.response.data || {};
    const headers = axiosError.response.headers || {};

    // Extract detail or message
    let message = data.detail || data.message;
    if (!message || typeof message !== 'string') {
      message = DEFAULT_STATUS_MESSAGES[status] || 'Đã có lỗi xảy ra từ máy chủ.';
    }

    // Extract code
    let code = data.code;
    if (!code && typeof data.error === 'object' && data.error !== null) {
      const errObj = data.error as Record<string, unknown>;
      if (typeof errObj.code === 'string') {
        code = errObj.code;
      }
    }

    // Extract field errors
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(data.errors)) {
      for (const item of data.errors) {
        if (item && item.field && item.message) {
          fieldErrors[item.field] = item.message;
        }
      }
    } else if (data.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries(data.errors)) {
        if (typeof v === 'string') {
          fieldErrors[k] = v;
        }
      }
    }

    // Extract Retry-After header for 429
    let retryAfterSec: number | undefined;
    const retryHeader = headers['retry-after'] || headers['Retry-After'];
    if (retryHeader) {
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
      traceId: data.traceId,
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
