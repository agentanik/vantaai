import { v4 as uuidv4 } from 'uuid';

export interface SafeApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: string[];
  };
}

export function safeApiError(error: any, requestId?: string): SafeApiErrorResponse {
  const reqId = requestId || uuidv4();
  
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal error occurred. Check backend logs using the request ID.';
  let details: string[] | undefined = undefined;
  
  if (error?.message) {
    const msgLower = String(error.message).toLowerCase();
    if (msgLower.includes('runpod health check failed')) {
      code = 'RUNPOD_HEALTH_CHECK_FAILED';
      message = 'RunPod health check failed. Check backend logs using the request ID.';
    } else if (error.status === 401 || error.status === 403 || msgLower.includes('authentication failed')) {
      code = 'UNAUTHORIZED';
      message = 'Authentication failed. Invalid API Key.';
    } else if (msgLower.includes('workflow validation failed') || error.code === 'WORKFLOW_VALIDATION_FAILED') {
      code = 'WORKFLOW_VALIDATION_FAILED';
      message = error.message;
      if (error.details) details = error.details;
    } else if (msgLower.includes('insufficient balance')) {
      code = 'INSUFFICIENT_BALANCE';
      message = 'Insufficient funds in RunPod account.';
    } else if (msgLower.includes('not found')) {
      code = 'NOT_FOUND';
      message = 'Resource not found.';
    } else if (error.code) {
      code = error.code;
    }
  }

  const response: SafeApiErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      requestId: reqId
    }
  };
  
  if (details) {
    response.error.details = details;
  }

  return response;
}
