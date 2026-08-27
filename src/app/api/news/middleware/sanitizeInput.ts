import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sanitizeInput } from '@/lib/security/validators';

/**
 * Middleware to sanitize string inputs in request body
 * Helps prevent XSS attacks by escaping HTML entities
 */
export async function sanitizeInputMiddleware(
  request: NextRequest,
  // @ts-ignore - calling next function
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Only process requests with body (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      // Clone the request to allow reading body multiple times
      const body = await request.json();
      
      // Sanitize string values in the body
      const sanitizedBody = sanitizeObject(body);
      
      // Create a new request with sanitized body
      // Note: We can't actually replace the request body in Next.js middleware
      // So we'll attach it to request for handlers to use
      // @ts-ignore
      request.sanitizedBody = sanitizedBody;
      
      return next();
    } catch (error) {
      // If body parsing fails, let the route handler deal with it
      return next();
    }
  }
  
  // For GET, DELETE, etc. just continue
  return next();
}

/**
 * Recursively sanitize string values in an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    // Return primitives as-is (but sanitize strings)
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  
  return sanitized;
}

/**
 * Basic HTML escaping for strings (already defined in validators.ts)
 * Duplicated here for clarity but could be imported
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

export const config = {
  matcher: '/api/news/:path*',
};
