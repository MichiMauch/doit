import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";

// Funktion zum Parsen von Task-Text mit Datum
function parseTaskWithDate(text: string): { title: string; dueDate: Date | null; hasTime: boolean; originalText: string } {
  const originalText = text;
  
  // Regex für verschiedene Datumsformate
  const datePatterns = [
    // DD.MM.YYYY HH:MM
    /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/,
    // DD.MM.YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    // DD.MM HH:MM (aktuelles Jahr)
    /(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})/,
    // DD.MM (aktuelles Jahr)
    /(\d{1,2})\.(\d{1,2})/,
  ];

  let title = text;
  let dueDate: Date | null = null;
  let hasTime = false;

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Entferne das Datum aus dem Titel
      title = text.replace(pattern, '').trim();
      
      let day: number, month: number, year: number;
      let hours: number | null = null;
      let minutes: number | null = null;
      
      if (match.length === 6) {
        // DD.MM.YYYY HH:MM
        [, day, month, year, hours, minutes] = match.map(Number);
        hasTime = true;
      } else if (match.length === 4) {
        // DD.MM.YYYY (nur Datum, keine Zeit)
        [, day, month, year] = match.map(Number);
      } else if (match.length === 5) {
        // DD.MM HH:MM
        [, day, month, hours, minutes] = match.map(Number);
        year = new Date().getFullYear();
        hasTime = true;
      } else if (match.length === 3) {
        // DD.MM (nur Datum, keine Zeit)
        [, day, month] = match.map(Number);
        year = new Date().getFullYear();
      } else {
        continue; // Kein valider Match, nächstes Pattern versuchen
      }
      
      // Validiere das Datum
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        if (hasTime && hours !== null && minutes !== null) {
          // Mit Zeit: Verwende lokale Zeitzone korrekt
          dueDate = new Date();
          dueDate.setFullYear(year, month - 1, day);
          dueDate.setHours(hours, minutes, 0, 0);
        } else {
          // Ohne Zeit: Nur Datum, keine spezifische Uhrzeit
          dueDate = new Date();
          dueDate.setFullYear(year, month - 1, day);
          dueDate.setHours(0, 0, 0, 0); // Mitternacht als neutraler Zeitpunkt
        }
        
        // Überprüfe ob das Datum gültig ist
        if (dueDate.getDate() !== day || dueDate.getMonth() !== month - 1) {
          dueDate = null; // Ungültiges Datum
        }
      }
      
      break;
    }
  }

  return { title, dueDate, hasTime, originalText };
}

// Slack signing secret für Verifikation
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

// Erlaubte Channels und User (Environment Variables)
const ALLOWED_CHANNELS = process.env.SLACK_ALLOWED_CHANNELS?.split(',').map(c => c.trim()) || [];
const ALLOWED_USERS = process.env.SLACK_ALLOWED_USERS?.split(',').map(u => u.trim()) || [];

// Funktion zur Überprüfung der Berechtigung
function isAuthorized(channelName: string, userName: string): { allowed: boolean; reason?: string } {
  // Wenn keine Beschränkungen konfiguriert sind, erlaube alles
  if (ALLOWED_CHANNELS.length === 0 && ALLOWED_USERS.length === 0) {
    return { allowed: true };
  }
  
  // Prüfe erlaubte Channels
  if (ALLOWED_CHANNELS.length > 0) {
    const isChannelAllowed = ALLOWED_CHANNELS.includes(channelName) || 
                            ALLOWED_CHANNELS.includes(`#${channelName}`) ||
                            ALLOWED_CHANNELS.includes('directmessage') && channelName === 'directmessage';
    if (isChannelAllowed) {
      return { allowed: true };
    }
  }
  
  // Prüfe erlaubte User
  if (ALLOWED_USERS.length > 0) {
    const isUserAllowed = ALLOWED_USERS.includes(userName) || 
                         ALLOWED_USERS.includes(`@${userName}`);
    if (isUserAllowed) {
      return { allowed: true };
    }
  }
  
  return { 
    allowed: false, 
    reason: `Channel "#${channelName}" oder User "${userName}" ist nicht berechtigt` 
  };
}

// Verifikation des Slack Requests
async function verifySlackRequest(request: NextRequest, body: string) {
  if (!SLACK_SIGNING_SECRET) {
    console.warn("🚨 SLACK_SIGNING_SECRET not configured");
    return false;
  }

  const signature = request.headers.get("x-slack-signature");
  const timestamp = request.headers.get("x-slack-request-timestamp");

  if (!signature || !timestamp) {
    return false;
  }

  // Verify timestamp (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const crypto = await import("crypto");
  const baseString = `v0:${timestamp}:${body}`;
  const expectedSignature = `v0=${crypto
    .createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(baseString)
    .digest("hex")}`;

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verify Slack request (temporarily disabled for testing)
    const isVerified = await verifySlackRequest(request, body);
    if (!isVerified && SLACK_SIGNING_SECRET) {
      console.error("🚨 Slack request verification failed");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!SLACK_SIGNING_SECRET) {
      console.warn("⚠️ SLACK_SIGNING_SECRET not set - verification skipped");
    }

    // Parse form data
    const formData = new URLSearchParams(body);
    const text = formData.get("text") || "";
    const userName = formData.get("user_name") || "Slack User";
    const channelName = formData.get("channel_name") || "unknown";
    const channelId = formData.get("channel_id") || "";

    console.log(`📝 Slack Todo from ${userName} in #${channelName} (${channelId}): "${text}"`);

    // Prüfe Berechtigung
    const authCheck = isAuthorized(channelName, userName);
    if (!authCheck.allowed) {
      console.warn(`🚫 Unauthorized Slack todo attempt: ${authCheck.reason}`);
      return NextResponse.json({
        response_type: "ephemeral",
        text: `🚫 Nicht berechtigt!\n\nDu kannst nur aus autorisierten Channels oder als autorisierter User Todos erstellen.\n\n${authCheck.reason}`,
      });
    }

    if (!text.trim()) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Bitte gib eine Aufgabe ein!\n\nBeispiele:\n• `/todo Meeting vorbereiten`\n• `/todo Report schreiben 08.07.2025`\n• `/todo Präsentation 15.12.2024 14:30`",
      });
    }

    // Parse task and date from text
    const { title, dueDate, hasTime } = parseTaskWithDate(text.trim());

    // Create todo in database
    const newTodo = await db.insert(todos).values({
      title: title,
      description: `Erstellt via Slack von ${userName} in #${channelName}`,
      completed: false,
      priority: "medium",
      dueDate: dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log(`✅ Todo created via Slack:`, newTodo[0]);

    // Formatiere die Antwort basierend auf ob ein Datum erkannt wurde
    const dueDateText = dueDate 
      ? hasTime 
        ? `\n📅 *Fällig:* ${dueDate.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`
        : `\n📅 *Fällig:* ${dueDate.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })}`
      : '';

    // Return success response to Slack
    return NextResponse.json({
      response_type: "ephemeral",
      text: `✅ Todo erfolgreich erstellt!\n\n📋 *${title}*${dueDateText}\n\n🔗 Sieh dir alle Todos an: https://doit.mauch.rocks`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Todo erfolgreich erstellt!*\n\n📋 ${title}${dueDateText}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "🔗 Alle Todos anzeigen",
              },
              url: "https://doit.mauch.rocks",
              action_id: "view_todos",
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("🚨 Slack todo creation error:", error);
    
    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ Fehler beim Erstellen der Aufgabe. Bitte versuche es später noch einmal.",
    });
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({ 
    message: "DOIT Slack Integration is running! 🚀",
    endpoint: "POST /api/slack/todo",
    usage: [
      "/todo <task description>",
      "/todo <task description> 08.07.2025",
      "/todo <task description> 15.12.2024 14:30",
      "/todo <task description> 25.03",
      "/todo <task description> 10.05 09:00"
    ],
    security: {
      allowed_channels: ALLOWED_CHANNELS.length > 0 ? ALLOWED_CHANNELS : "All channels allowed",
      allowed_users: ALLOWED_USERS.length > 0 ? ALLOWED_USERS : "All users allowed",
      signing_secret_configured: !!SLACK_SIGNING_SECRET
    }
  });
}