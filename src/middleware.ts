import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting for prototype. 
// Note: In a multi-instance production environment, use a centralized store like Redis.
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 20; // max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
  // Only protect API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");

    // Enforce Authentication
    if (!authHeader || authHeader !== "Bearer idbi-prototype-auth-token") {
      return NextResponse.json(
        { error: "401 Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    // Enforce Rate Limiting
    // Use x-forwarded-for header for IP tracking
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown_ip";
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    let requestData = rateLimitMap.get(ip);
    
    if (!requestData || requestData.timestamp < windowStart) {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    } else {
      if (requestData.count >= RATE_LIMIT) {
        return NextResponse.json(
          { error: "429 Too Many Requests: Rate limit exceeded. Please try again in a minute." },
          { status: 429 }
        );
      }
      requestData.count += 1;
      rateLimitMap.set(ip, requestData);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
