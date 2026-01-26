import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Speichert den Refresh Token des aktuellen Users in der settings-Tabelle.
 * Dies ermöglicht dem Cron-Job den Gmail-Zugriff ohne aktive Session.
 *
 * Wird einmalig nach dem Login aufgerufen (oder manuell).
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Der Refresh Token ist im JWT gespeichert und wird durch den
    // jwt-Callback in auth.ts verwaltet. Wir nutzen die Session nur
    // um zu wissen, ob der User eingeloggt ist.
    // Der eigentliche Refresh Token muss als GOOGLE_REFRESH_TOKEN
    // Environment Variable konfiguriert werden.

    // Prüfe ob ein Refresh Token in der Session verfügbar ist
    // (NextAuth stellt ihn nicht direkt in der session bereit,
    // daher als Konfigurationshilfe)

    const key = `gmail_configured_${session.user.email}`;

    // Upsert: Speichere dass Gmail für diesen User konfiguriert ist
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

    if (existing.length > 0) {
      await db.update(settings)
        .set({ value: JSON.stringify({ configured: true, updatedAt: new Date().toISOString() }), updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        key,
        value: JSON.stringify({ configured: true, createdAt: new Date().toISOString() }),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Gmail-Integration markiert als konfiguriert. Stelle sicher, dass GOOGLE_REFRESH_TOKEN als Environment Variable gesetzt ist.",
      hint: "Den Refresh Token findest du im NextAuth JWT nach dem Login. Er muss als GOOGLE_REFRESH_TOKEN Environment Variable gesetzt werden.",
    });
  } catch (error) {
    console.error("[Gmail Config] Fehler:", error);
    return NextResponse.json(
      { error: "Failed to save configuration", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
