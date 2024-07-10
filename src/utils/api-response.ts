export type ApiResponse = {
  message: string;
  data: any;
};

export type ErrorResponse = {
  message: string;
  stack?: string;
};

function success(message: string, data: any): ApiResponse {
  return { message, data };
}

function error(message: string, stack?: string): ErrorResponse {
  return { message, stack };
}

export default {
  success,
  error,
};
