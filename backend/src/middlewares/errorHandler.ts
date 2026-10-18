import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404, "ROUTE_NOT_FOUND"));
};

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer error:", error);
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds the maximum limit. Please upload a smaller image."
        : `File upload error: ${error.message}`;
    return res.status(400).json({
      success: false,
      message,
      errorType: "FILE_UPLOAD_ERROR",
      details: { code: error.code, field: error.field },
    });
  }

  if (
    (error as { type?: string })?.type === "entity.too.large" ||
    (error as { status?: number })?.status === 413 ||
    (error as { statusCode?: number })?.statusCode === 413
  ) {
    return res.status(413).json({
      success: false,
      message: "The uploaded payload is too large. Maximum allowed size is 25MB.",
      errorType: "PAYLOAD_TOO_LARGE",
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      errorType: "VALIDATION_ERROR",
      details: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    console.error(error.stack);
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorType: error.errorType,
      details: error.details,
    });
  }

  if (error?.name === "ValidationError") {
    console.error(error.stack);
    return res.status(400).json({
      success: false,
      message: "MongoDB document validation failed",
      errorType: "DATABASE_VALIDATION_ERROR",
      details: error.errors,
    });
  }

  if (error?.code === 11000) {
    console.error(error);
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists",
      errorType: "DUPLICATE_RECORD",
      details: error.keyValue,
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Unexpected server failure while processing the request",
    errorType: "UNEXPECTED_SERVER_ERROR",
  });
};
