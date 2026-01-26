import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { authenticated: false, reason: "no_session" },
        { status: 401 }
      );
    }

    // Prüfe Gmail-Zugriff durch Label-Abfrage
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.labels.list({ userId: "me" });

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("[Gmail Auth Check] Fehler:", error);
    return NextResponse.json(
      { authenticated: false, reason: "insufficient_scope" },
      { status: 403 }
    );
  }
}
