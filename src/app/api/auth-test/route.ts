import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedEmails = (process.env.ALLOWED_EMAILS || "")
      .split(',')
      .map(email => email.trim().toLowerCase());

    return NextResponse.json({
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      isAllowed: session?.user?.email ? allowedEmails.includes(session.user.email.toLowerCase()) : false,
      allowedEmailsCount: allowedEmails.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Auth check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}