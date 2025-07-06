import { NextResponse } from "next/server";

export async function GET() {
  const statusInfo = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    config: {
      nextauthUrlSet: !!process.env.NEXTAUTH_URL,
      nextauthUrl: process.env.NEXTAUTH_URL,
      allowedEmailsSet: !!process.env.ALLOWED_EMAILS,
      allowedEmailsCount: process.env.ALLOWED_EMAILS?.split(',').length || 0,
      googleClientIdSet: !!process.env.GOOGLE_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
    }
  };

  return NextResponse.json(statusInfo);
}