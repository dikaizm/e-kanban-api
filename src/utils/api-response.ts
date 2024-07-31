export type ApiResponse = {
  success: boolean;
  message: string;
  data: any;
};

export type ErrorResponse = {
  success: boolean;
  message: string;
  stack?: string;
};

function success(message: string, data: any): ApiResponse {
  return { success: true, message, data };
}

function error(message: string, stack?: string): ErrorResponse {
  return { success: false, message, stack };
}

export default {
  success,
  error,
};
