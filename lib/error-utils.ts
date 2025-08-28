import { NextResponse } from 'next/server';

// Standard error types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// Standard error response interface
export interface ErrorResponse {
  error: string;
  message: string;
  type: ErrorType;
  statusCode: number;
  timestamp: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

// Error response creation utility
export function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  retryable: boolean = false,
  retryAfter?: number
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: type,
    message,
    type,
    statusCode,
    timestamp: new Date().toISOString(),
    retryable,
    retryAfter
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Specific error creators
export const createValidationError = (message: string) =>
  createErrorResponse(ErrorType.VALIDATION_ERROR, message, 400);

export const createAuthError = (message: string = 'Authentication required') =>
  createErrorResponse(ErrorType.AUTHENTICATION_ERROR, message, 401);

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  createErrorResponse(ErrorType.AUTHORIZATION_ERROR, message, 403);

export const createNotFoundError = (message: string = 'Resource not found') =>
  createErrorResponse(ErrorType.NOT_FOUND_ERROR, message, 404);

export const createRateLimitError = (retryAfter: number = 60) =>
  createErrorResponse(
    ErrorType.RATE_LIMIT_ERROR,
    'Rate limit exceeded. Please try again later.',
    429,
    true,
    retryAfter
  );

export const createExternalApiError = (message: string, retryable: boolean = true) =>
  createErrorResponse(
    ErrorType.EXTERNAL_API_ERROR,
    `External service error: ${message}`,
    502,
    retryable,
    30
  );

export const createDatabaseError = (message: string = 'Database connection failed') =>
  createErrorResponse(
    ErrorType.DATABASE_ERROR,
    message,
    503,
    true,
    60
  );

export const createInternalError = (message: string = 'Internal server error') =>
  createErrorResponse(ErrorType.INTERNAL_SERVER_ERROR, message, 500);

// Network error detection
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }
  return false;
}

// API response error detection
export function isApiError(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'statusCode' in error
  );
}

// Retry logic utility
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on non-retryable errors
      if (isApiError(error) && !error.retryable) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Circuit breaker pattern for external APIs
class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold = 5,
    private readonly successThreshold = 2,
    private readonly timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt
    };
  }
}

// Create circuit breaker instances for external services
export const blakeApiCircuitBreaker = new CircuitBreaker(3, 2, 30000); // 30 second timeout

// Enhanced fetch with error handling
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  useCircuitBreaker: boolean = true
): Promise<T> {
  const operation = async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  try {
    if (useCircuitBreaker && url.includes('withblake.ai')) {
      return await blakeApiCircuitBreaker.execute(operation);
    }
    return await withRetry(operation);
  } catch (error) {
    if (isNetworkError(error)) {
      throw createExternalApiError('Network connection failed', true);
    }
    throw error;
  }
}