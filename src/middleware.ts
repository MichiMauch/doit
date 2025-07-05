import { withAuth } from "next-auth/middleware";

export default withAuth(
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log("🔒 Middleware check for:", req.nextUrl.pathname);
        console.log("🔒 Token exists:", !!token);
        if (token) {
          console.log("🔒 Token email:", token.email);
        }
        
        // User must be authenticated to access protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

// Protect all routes except auth pages and public assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};