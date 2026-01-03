import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  requestId?: string;
  details?: any;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error | string,
  requestId?: string
): NextResponse<ErrorResponse> {
  let apiError: ApiError;

  if (typeof error === 'string') {
    apiError = {
      message: error,
      statusCode: 500,
    };
  } else if (error instanceof Error) {
    apiError = {
      message: error.message,
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  } else {
    apiError = error;
  }

  const response: ErrorResponse = {
    error: apiError.message,
    ...(apiError.code && { code: apiError.code }),
    ...(requestId && { requestId }),
    ...(process.env.NODE_ENV === 'development' && apiError.details && { details: apiError.details }),
  };

  return NextResponse.json(response, { status: apiError.statusCode });
}

/**
 * Handle common error types
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Handle known error types
  if (error instanceof Error) {
    const message = error.message;

    // Authentication errors
    if (message.includes('Unauthorized') || message.includes('No authentication token')) {
      return createErrorResponse(
        {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        },
        requestId
      );
    }

    // Authorization errors
    if (message.includes('Forbidden') || message.includes('not allowed')) {
      return createErrorResponse(
        {
          message: 'Forbidden',
          code: 'FORBIDDEN',
          statusCode: 403,
        },
        requestId
      );
    }

    // Validation errors
    if (message.includes('Invalid') || message.includes('required') || message.includes('validation')) {
      return createErrorResponse(
        {
          message: error.message,
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        },
        requestId
      );
    }

    // Not found errors
    if (message.includes('not found')) {
      return createErrorResponse(
        {
          message: error.message,
          code: 'NOT_FOUND',
          statusCode: 404,
        },
        requestId
      );
    }

    // Generic error
    return createErrorResponse(
      {
        message: error.message,
        statusCode: 500,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      requestId
    );
  }

  // Unknown error type
  return createErrorResponse(
    {
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
    requestId
  );
}

/**
 * Generate a request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (req: any, ...args: T) => Promise<NextResponse>,
  options?: {
    logError?: (error: unknown, requestId: string) => void;
  }
) {
  return async (req: any, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    
    try {
      return await handler(req, ...args);
    } catch (error) {
      // Log error if logger provided
      if (options?.logError) {
        options.logError(error, requestId);
      }
      
      return handleApiError(error, requestId);
    }
  };
}

