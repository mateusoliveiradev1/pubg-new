import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // max requests per window

/**
 * Middleware to implement rate limiting
 * Limits requests per IP address
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  // @ts-ignore - calling next function
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.ip ||
             'unknown';
  
  // Skip rate limiting for localhost in development
  if (process.env.NODE_ENV === 'development' && 
      (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1')) {
    return next();
  }
  
  const now = Date.now();
  
  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create rate limit data for this IP
  const rateLimitData = rateLimitStore.get(ip) || {
    count: 0,
    resetTime: now + WINDOW_MS
  };
  
  // Reset if window expired
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + WINDOW_MS;
  }
  
  // Increment counter
  rateLimitData.count++;
  
  // Store back
  rateLimitStore.set(ip, rateLimitData);
  
  // Check if limit exceeded
  if (rateLimitData.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
    
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: `Too many requests, please try again after ${retryAfter} seconds`
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.resetTime.toString()
        }
      }
    );
  }
  
  // Add rate limit headers to response
  const response = await next();
  
  // Clone headers to avoid mutating original
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  newHeaders.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - rateLimitData.count).toString());
  newHeaders.set('X-RateLimit-Reset', rateLimitData.resetTime.toString());
  
  return new NextResponse(response.body, {
    status: response.status,
    headers: newHeaders
  });
}

export const config = {
  matcher: '/api/news/:path*',
};
