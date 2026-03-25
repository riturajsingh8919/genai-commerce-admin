import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "nexring-admin-secret-2026";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only protect genai-admin routes, excluding the login page
  if (
    pathname.startsWith("/genai-admin") &&
    pathname !== "/genai-admin/login"
  ) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/genai-admin/login";
      return NextResponse.redirect(url);
    }

    try {
      // Verify JWT (using jose because middleware runs on Edge runtime)
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/genai-admin/login";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      const url = request.nextUrl.clone();
      url.pathname = "/genai-admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/genai-admin/:path*"],
};
