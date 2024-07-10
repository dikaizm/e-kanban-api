export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function ApiErr(message: string, statusCode = 500): ApiError {
  return new ApiError(message, statusCode);
}
