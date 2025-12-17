import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const isLoginPage = pathname === "/login";
    const hasError = token?.error === "RefreshAccessTokenError";
    const isAuthenticated = !!token && !hasError;

    // Authenticated users should not stay on /login
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/space", req.url));
    }

    // Unauthenticated or error → must go to /login (but allow staying on /login)
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,   // ← this disables the built-in redirect
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|api/wrike|.*\\..*).*)",
  ],
};