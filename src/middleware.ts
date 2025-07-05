import { withAuth } from "next-auth/middleware";

// Allowed email addresses
const ALLOWED_EMAILS = [
  (process.env.ALLOWED_EMAIL || "your-email@example.com").toLowerCase(),
];

export default withAuth(
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log("🔒 Middleware check for:", req.nextUrl.pathname);
        console.log("🔒 Token exists:", !!token);
        
        if (!token) {
          console.log("🔒 No token, redirecting to sign in");
          return false;
        }
        
        console.log("🔒 Token email:", token.email);
        console.log("🔒 Allowed emails:", ALLOWED_EMAILS);
        
        // Check if user email is authorized
        if (token.email && ALLOWED_EMAILS.includes(token.email.toLowerCase())) {
          console.log("🔒 ✅ Email authorized, allowing access");
          return true;
        }
        
        console.log("🔒 ❌ Email not authorized, denying access");
        return false;
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