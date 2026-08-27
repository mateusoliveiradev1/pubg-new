import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateNewsData } from '@/lib/security/validators';

/**
 * Middleware to validate incoming news data
 * Validates request body against news schema
 */
export async function validateNewsMiddleware(
  request: NextRequest,
  // @ts-ignore - calling next function
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Only validate POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json();
      
      // Validate against our news schema
      validateNewsData(body);
      
      // Validation passed, continue to next middleware/handler
      return next();
    } catch (error: any) {
      // Validation failed
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      
      // Unexpected error
      console.error('Validation middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  // For GET, DELETE, etc. just continue
  return next();
}

export const config = {
  matcher: '/api/news/:path*',
};
