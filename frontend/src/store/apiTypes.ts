import { AxiosError } from "axios";

export type ApiMessageResponse = {
  success: true;
  message: string;
};

export type ApiDataResponse<T> = ApiMessageResponse & {
  data: T;
};

export type PaginatedApiResponse<T> = {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errorType: string;
  details?: unknown;
};

export type MongoEntity = {
  _id?: string;
  id?: string;
};

export function listPayload<T>(payload: T[] | PaginatedApiResponse<T>): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}
