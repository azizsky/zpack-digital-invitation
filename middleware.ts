import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Cek apakah user punya cookie 'admin_session'
  const adminSession = request.cookies.get("admin_session")?.value;

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/admin/dashboard");

  // Jika coba masuk dashboard tapi tidak punya cookie session -> tendang ke login
  if (isDashboardRoute && !adminSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

// Hanya jalankan middleware ini pada jalur admin/dashboard
export const config = {
  matcher: ["/admin/dashboard/:path*"],
};