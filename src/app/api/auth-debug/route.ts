import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  // Only show debug info in development or if explicitly enabled
  const isDebugEnabled = process.env.NODE_ENV === "development" || process.env.DEBUG_MODE === "true";
  
  if (!isDebugEnabled) {
    return NextResponse.json({ message: "Debug mode disabled" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  
  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(',')
    .map(email => email.trim().toLowerCase());

  const debugInfo = {
    session: session ? {
      user: session.user,
      expires: session.expires,
      hasAccessToken: !!session.accessToken
    } : null,
    allowedEmails,
    userIsAllowed: session?.user?.email ? allowedEmails.includes(session.user.email.toLowerCase()) : false,
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo);
}