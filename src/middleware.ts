import { withAuth } from "next-auth/middleware";

// Allowed email addresses
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "your-email@example.com")
  .split(',')
  .map(email => email.trim().toLowerCase());

export default withAuth(
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Always allow auth pages, API routes, and debug
        if (pathname.startsWith('/auth') || pathname.startsWith('/api') || pathname.startsWith('/debug')) {
          return true;
        }
        
        // If no token, redirect to sign in
        if (!token?.email) {
          return false;
        }
        
        // Check if email is authorized
        const isAuthorized = ALLOWED_EMAILS.includes(token.email.toLowerCase());
        
        if (!isAuthorized) {
          // Redirect unauthorized users to error page instead of sign in
          return false;
        }
        
        return true;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

// Protect main routes but exclude auth and static files
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|debug).*)",
  ],
};