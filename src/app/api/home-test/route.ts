import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        status: "no_session",
        message: "No session found - would redirect to signin",
        redirectTo: "/auth/signin"
      });
    }

    const allowedEmails = (process.env.ALLOWED_EMAILS || "")
      .split(',')
      .map(email => email.trim().toLowerCase());

    const isAllowed = allowedEmails.includes(session.user.email.toLowerCase());

    if (!isAllowed) {
      return NextResponse.json({
        status: "unauthorized",
        message: "User not in allowed list - would redirect to error",
        userEmail: session.user.email,
        allowedEmails: allowedEmails,
        redirectTo: "/auth/error"
      });
    }

    return NextResponse.json({
      status: "authorized",
      message: "User should be able to access main app",
      userEmail: session.user.email,
      sessionExpires: session.expires,
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}