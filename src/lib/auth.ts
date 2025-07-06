import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

// Allowed email addresses - only you can access the app
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "your-email@example.com")
  .split(',')
  .map(email => email.trim().toLowerCase());

console.log("🔐 Auth config initialized with allowed emails:", ALLOWED_EMAILS);
console.log("🔐 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("🔐 NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
console.log("🔐 GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);

async function refreshAccessToken(token: JWT) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken || "",
      }),
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email", 
            "profile",
            "https://www.googleapis.com/auth/calendar"
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("🔐 SignIn callback for:", user.email);
      
      // Allow sign-in for anyone, authorization happens in middleware
      if (user.email && account?.provider === "google") {
        console.log("🔐 Google sign-in successful for:", user.email);
        return true;
      }
      
      console.log("🔐 Sign-in rejected - no email or invalid provider");
      return false;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        console.log("🔐 JWT: Initial sign-in for:", user.email);
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at! * 1000,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      if (Date.now() < ((token.accessTokenExpires as number) - bufferTime)) {
        return token;
      }

      // Access token has expired, try to update it
      console.log("🔐 Access token expired, refreshing...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
