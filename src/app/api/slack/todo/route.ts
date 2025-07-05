import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";

// Slack signing secret für Verifikation
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

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
    
    // Verify Slack request
    const isVerified = await verifySlackRequest(request, body);
    if (!isVerified) {
      console.error("🚨 Slack request verification failed");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = new URLSearchParams(body);
    const text = formData.get("text") || "";
    const userName = formData.get("user_name") || "Slack User";
    const channelName = formData.get("channel_name") || "unknown";

    console.log(`📝 Slack Todo from ${userName} in #${channelName}: "${text}"`);

    if (!text.trim()) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Bitte gib eine Aufgabe ein!\n\nBeispiel: `/todo Meeting vorbereiten`",
      });
    }

    // Create todo in database
    const newTodo = await db.insert(todos).values({
      title: text.trim(),
      description: `Erstellt via Slack von ${userName} in #${channelName}`,
      completed: false,
      priority: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log(`✅ Todo created via Slack:`, newTodo[0]);

    // Return success response to Slack
    return NextResponse.json({
      response_type: "ephemeral",
      text: `✅ Todo erfolgreich erstellt!\n\n📋 *${text.trim()}*\n\n🔗 Sieh dir alle Todos an: https://doit.mauch.rocks`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Todo erfolgreich erstellt!*\n\n📋 ${text.trim()}`,
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
    usage: "/todo <your task description>"
  });
}