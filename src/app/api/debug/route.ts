import { NextResponse } from "next/server";

export async function GET() {
  // Only show debug info in development or if explicitly enabled
  const isDebugEnabled = process.env.NODE_ENV === "development" || process.env.DEBUG_MODE === "true";
  
  if (!isDebugEnabled) {
    return NextResponse.json({ message: "Debug mode disabled" }, { status: 403 });
  }

  const debugInfo = {
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL,
    nextauthSecretExists: !!process.env.NEXTAUTH_SECRET,
    googleClientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    allowedEmails: process.env.ALLOWED_EMAILS,
    allowedEmailsArray: process.env.ALLOWED_EMAILS?.split(',').map(email => email.trim()),
    databaseUrlExists: !!process.env.TURSO_DATABASE_URL,
    databaseAuthTokenExists: !!process.env.TURSO_AUTH_TOKEN,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo);
}