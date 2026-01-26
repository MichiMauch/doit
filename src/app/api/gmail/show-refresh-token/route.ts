import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Einmaliger Hilfs-Endpoint um den Refresh Token aus dem JWT auszulesen.
 * Diesen Endpoint nach Gebrauch wieder löschen oder deaktivieren!
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: "Nicht eingeloggt. Bitte zuerst einloggen." },
        { status: 401 }
      );
    }

    const refreshToken = token.refreshToken as string | undefined;

    if (!refreshToken) {
      return NextResponse.json({
        error: "Kein Refresh Token gefunden. Bitte ausloggen und neu einloggen (mit 'consent' prompt).",
      });
    }

    return NextResponse.json({
      message: "Kopiere diesen Refresh Token in deine .env.local Datei als GOOGLE_REFRESH_TOKEN",
      refreshToken,
      hint: "GOOGLE_REFRESH_TOKEN=" + refreshToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
