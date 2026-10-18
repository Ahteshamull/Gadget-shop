import type { Response } from "express";

export type ApiErrorPayload = {
  success: false;
  message: string;
  errorType: string;
  details?: unknown;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function sendCreated<T>(res: Response, message: string, data: T): Response {
  return res.status(201).json({ success: true, message, data });
}

export function sendSuccess<T>(res: Response, message: string, data: T): Response {
  return res.status(200).json({ success: true, message, data });
}

export function sendOk<T>(res: Response, data: T): Response {
  return res.status(200).json(data);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): Response {
  return res.status(200).json({ success: true, data, meta });
}

export function sendMessage(res: Response, message: string): Response {
  return res.status(200).json({ success: true, message });
}
