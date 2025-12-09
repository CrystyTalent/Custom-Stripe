import { NextRequest, NextResponse } from 'next/server';
import { cors, addCorsHeaders } from './lib/cors';

export function middleware(request: NextRequest) {
  // Only apply CORS to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Handle preflight OPTIONS request
    const corsResponse = cors(request);
    if (corsResponse) {
      return corsResponse;
    }

    // For other requests, we'll add CORS headers in the route handlers
    // This middleware just handles OPTIONS preflight
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

