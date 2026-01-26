import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGmailService, type GmailMessage } from "@/lib/google-gmail";
import { EmailAIService } from "@/lib/email-ai";
import { TodoService } from "@/lib/db/service";

/**
 * Entfernt das DOIT-Label von der Hauptnachricht und allen weiteren Nachrichten im Thread.
 */
async function removeLabelsFromThread(message: GmailMessage, labelId: string, accessToken: string) {
  await GoogleGmailService.removeDoitLabel(message.id, labelId, accessToken);
  for (const extraId of message.extraMessageIds || []) {
    try {
      await GoogleGmailService.removeDoitLabel(extraId, labelId, accessToken);
    } catch {
      // Einzelne Fehler ignorieren
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung: API-Key (Cron) oder Session (manueller Aufruf)
    const apiKey = request.headers.get("x-api-key");
    const isAuthorizedCron = apiKey === process.env.CRON_SECRET;

    let accessToken: string | undefined;
    let userEmail: string | undefined;

    if (isAuthorizedCron) {
      // Cron-Modus: Verwende gespeicherten Refresh Token
      userEmail = process.env.CRON_USER_EMAIL;

      if (!userEmail) {
        return NextResponse.json(
          { error: "CRON_USER_EMAIL not configured" },
          { status: 500 }
        );
      }

      // Access Token über Refresh Token holen
      const cronToken = await refreshAccessTokenForCron();
      if (!cronToken) {
        return NextResponse.json(
          { error: "Failed to get access token. User needs to re-authenticate and save refresh token." },
          { status: 401 }
        );
      }
      accessToken = cronToken;
    } else {
      // Session-Modus: Verwende aktuellen User
      const session = await getServerSession(authOptions);
      if (!session?.accessToken || !session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      accessToken = session.accessToken;
      userEmail = session.user.email;
    }

    console.log(`[Gmail Cron] Starte E-Mail-Verarbeitung für ${userEmail}`);

    // 1. DOIT-Label finden
    const labelId = await GoogleGmailService.getDoitLabelId(accessToken);
    if (!labelId) {
      return NextResponse.json({
        success: true,
        message: 'Label "DOIT" nicht in Gmail gefunden. Bitte erstelle das Label zuerst.',
        processed: 0,
        skipped: 0,
        errors: [],
      });
    }

    // 2. E-Mails mit DOIT-Label abrufen
    const messages = await GoogleGmailService.getDoitMessages(accessToken);
    if (messages.length === 0) {
      console.log("[Gmail Cron] Keine neuen E-Mails mit DOIT-Label");
      return NextResponse.json({
        success: true,
        processed: 0,
        skipped: 0,
        errors: [],
      });
    }

    console.log(`[Gmail Cron] ${messages.length} E-Mails zu verarbeiten`);

    // 3. Jede E-Mail verarbeiten
    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as Array<{ messageId: string; subject: string; error: string }>,
      details: [] as Array<{ messageId: string; subject: string; todoTitle: string }>,
    };

    for (const message of messages) {
      try {
        // Duplikat-Check (Thread-ID als emailSource)
        const existing = await TodoService.getTodoByEmailSource(message.threadId, userEmail);
        if (existing) {
          console.log(`[Gmail Cron] Überspringe bereits verarbeiteten Thread: ${message.subject}`);
          // Label von allen Nachrichten im Thread entfernen
          try {
            await removeLabelsFromThread(message, labelId, accessToken);
          } catch {
            // Ignorieren
          }
          results.skipped++;
          continue;
        }

        // AI-Zusammenfassung erstellen
        const summary = await EmailAIService.summarizeEmail(message);

        // Todo erstellen
        const description = [
          summary.description,
          "",
          `---`,
          `Quelle: E-Mail von ${message.from}`,
          `Datum: ${message.date.toLocaleDateString("de-DE")}`,
          `Betreff: ${message.subject}`,
        ].join("\n");

        await TodoService.createTodo({
          title: summary.title,
          description,
          priority: summary.priority,
          estimatedHours: summary.estimatedHours,
          dueDate: summary.suggestedDueDate,
          emailSource: message.threadId,
          tags: JSON.stringify(["email"]),
          userEmail: userEmail!,
        });

        // DOIT-Label von allen Nachrichten im Thread entfernen
        try {
          await removeLabelsFromThread(message, labelId, accessToken);
        } catch (labelError) {
          console.error(`[Gmail Cron] Label-Entfernung fehlgeschlagen für Thread ${message.threadId}:`, labelError instanceof Error ? labelError.message : labelError);
        }

        results.processed++;
        results.details.push({
          messageId: message.id,
          subject: message.subject,
          todoTitle: summary.title,
        });

        console.log(`[Gmail Cron] Todo erstellt: "${summary.title}" (aus: "${message.subject}")`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Gmail Cron] Fehler bei E-Mail "${message.subject}":`, errorMessage);
        results.errors.push({
          messageId: message.id,
          subject: message.subject,
          error: errorMessage,
        });
      }
    }

    console.log(
      `[Gmail Cron] Fertig: ${results.processed} verarbeitet, ${results.skipped} übersprungen, ${results.errors.length} Fehler`
    );

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("[Gmail Cron] Schwerwiegender Fehler:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generiert einen frischen Access Token für den Cron-Job
 * über den gespeicherten Refresh Token.
 */
async function refreshAccessTokenForCron(): Promise<string | null> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("[Gmail Cron] Fehlende Konfiguration:", {
      refreshToken: !!refreshToken,
      clientId: !!clientId,
      clientSecret: !!clientSecret,
    });
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      console.error("[Gmail Cron] Token Refresh fehlgeschlagen:", data.error || data);
      return null;
    }

    return data.access_token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Gmail Cron] Fehler beim Token Refresh:", message);
    return null;
  }
}

// GET-Endpoint für Status/Info (nur mit API-Key)
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    service: "Gmail-to-Todo Processor",
    status: "running",
    config: {
      cronUserEmail: process.env.CRON_USER_EMAIL ? "configured" : "missing",
      cronSecret: "configured",
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN ? "configured" : "missing",
      openaiKey: process.env.OPENAI_API_KEY ? "configured" : "missing",
    },
  });
}
