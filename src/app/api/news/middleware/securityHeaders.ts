import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to add security headers to responses
 * Implements various security best practices
 */
export async function securityHeadersMiddleware(
  request: NextRequest,
  // @ts-ignore - calling next function
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await next();
  
  // Create a headers object from the response
  const headers = new Headers(response.headers);
  
  // Security Headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  // Adjust based on your actual needs (fonts, images, scripts sources)
  const cspDefaults = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for your JS needs
    "style-src 'self' 'unsafe-inline'", // Tailwind needs inline styles
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  
  headers.set('Content-Security-Policy', cspDefaults.join('; '));
  
  // HSTS (only over HTTPS in production)
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') === 'https') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Permissions Policy (formerly Feature Policy)
  headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  
  // Remove or hide potentially dangerous headers
  headers.set('Server', 'next.js'); // Don't reveal actual server
  
  // Return new response with updated headers
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const config = {
  matcher: '/api/news/:path*',
};
