// =============================================================================
// EduManage — Next.js Middleware
// Protects routes and enforces role-based redirects at the edge
// =============================================================================

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/types/enums";

const { auth } = NextAuth(authConfig);

// Routes accessible without authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/unauthorized"];

// Role → dashboard mapping
const ROLE_DASHBOARD: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

// Route prefix → required roles
const PROTECTED_ROUTES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/teacher", roles: ["TEACHER"] },
  { prefix: "/student", roles: ["STUDENT"] },
];

export default auth((req: NextRequest & { auth: { user?: { role?: Role } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow NextAuth API routes unconditionally
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    if (session?.user?.role) {
      const dashboard = ROLE_DASHBOARD[session.user.role];
      return NextResponse.redirect(new URL(dashboard, req.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    if (session?.user?.role) {
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD[session.user.role], req.url)
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Not authenticated — redirect to login
  if (!session?.user?.role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access to dashboard sections
  for (const route of PROTECTED_ROUTES) {
    if (pathname.startsWith(route.prefix)) {
      if (!route.roles.includes(session.user.role)) {
        // Wrong role — redirect to their actual dashboard
        const correctDashboard = ROLE_DASHBOARD[session.user.role];
        return NextResponse.redirect(new URL(correctDashboard, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};
