import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 */
function getClientId(req: NextRequest): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Also include the route path to have separate limits per endpoint
  const path = req.nextUrl.pathname;
  
  return `${ip}:${path}`;
}

/**
 * Rate limit middleware
 * Returns null if request is allowed, or NextResponse with error if rate limited
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const clientId = getClientId(req);
  const now = Date.now();

  // Get or create entry for this client
  if (!store[clientId] || store[clientId].resetTime < now) {
    store[clientId] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  store[clientId].count++;

  // Check if limit exceeded
  if (store[clientId].count > config.maxRequests) {
    return NextResponse.json(
      {
        error: config.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((store[clientId].resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((store[clientId].resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(store[clientId].resetTime / 1000)),
        },
      }
    );
  }

  // Request allowed
  return null;
}

/**
 * Rate limit wrapper for API routes
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResponse = rateLimit(req, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(req, ...args);
  };
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict limit for login (5 attempts per 15 minutes)
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  // Standard limit for write operations (100 requests per minute)
  write: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.',
  },
  // Lenient limit for read operations (200 requests per minute)
  read: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.',
  },
};

