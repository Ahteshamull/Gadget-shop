export class AppError extends Error {
  statusCode: number;
  errorType: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, errorType = "APPLICATION_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
  }
}
