/**
 * Robust API client: timeout, retries, and consistent error handling.
 * Use for all dashboard API calls to avoid stuck loading and failed fetches in production.
 */

const DEFAULT_TIMEOUT_MS = 20000; // 20s
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ApiClientOptions extends RequestInit {
  /** Request timeout in ms. Default 20000. */
  timeout?: number;
  /** Number of retries on failure (network or 5xx). Default 2. */
  retries?: number;
  /** Skip retries (e.g. for mutations). */
  skipRetry?: boolean;
}

/**
 * Fetch with timeout and retry. Use instead of raw fetch() for dashboard API calls.
 * - Times out after 20s by default
 * - Retries on network error or 5xx (2 retries with 1s delay)
 * - Throws ApiError with status and body for 4xx/5xx
 * - 401/403: throws so caller can redirect to login
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: ApiClientOptions
): Promise<Response> {
  const timeoutMs = init?.timeout ?? DEFAULT_TIMEOUT_MS;
  const retries = init?.skipRetry ? 0 : (init?.retries ?? DEFAULT_RETRIES);
  const { timeout, retries: _r, skipRetry: _s, ...fetchInit } = init || {};

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(input, {
        ...fetchInit,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Don't retry on 4xx (client errors)
      if (response.status >= 400 && response.status < 500) {
        let body: unknown = null;
        try {
          const text = await response.text();
          if (text) body = JSON.parse(text);
        } catch {
          body = null;
        }
        throw new ApiError(
          (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
            ? (body as { error: string }).error
            : `Request failed: ${response.status}`,
          response.status,
          body
        );
      }

      // Retry on 5xx or network/abort
      if (response.status >= 500 && attempt < retries) {
        lastError = new ApiError(`Server error: ${response.status}`, response.status);
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (response.status >= 500) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        throw new ApiError(
          (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
            ? (body as { error: string }).error
            : `Server error: ${response.status}`,
          response.status,
          body
        );
      }

      return response;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      const isAbort = lastError.name === 'AbortError';
      const isNetwork = lastError.message?.includes('fetch') || lastError.message?.includes('network');
      if ((isAbort || isNetwork) && attempt < retries) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      if (isAbort) {
        throw new ApiError('Request timed out. Please try again.');
      }
      throw lastError;
    }
  }
  throw lastError ?? new ApiError('Request failed');
}

/**
 * GET JSON with apiFetch. Returns parsed body or throws ApiError.
 */
export async function apiGet<T = unknown>(url: string, options?: ApiClientOptions): Promise<T> {
  const res = await apiFetch(url, { ...options, method: 'GET' });
  const data = await res.json();
  return data as T;
}
