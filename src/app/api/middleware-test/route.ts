import { NextResponse } from "next/server";

export async function GET() {
  const allowedEmails = (process.env.ALLOWED_EMAILS || "your-email@example.com")
    .split(',')
    .map(email => email.trim().toLowerCase());

  return NextResponse.json({
    allowedEmails,
    allowedEmailsRaw: process.env.ALLOWED_EMAILS,
    middlewareConfig: {
      hasAllowedEmails: !!process.env.ALLOWED_EMAILS,
      emailCount: allowedEmails.length,
    },
    timestamp: new Date().toISOString(),
  });
}