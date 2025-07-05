import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const eventData = await request.json();
    
    // Validiere required fields
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { error: "Missing required fields: summary, start, end" },
        { status: 400 }
      );
    }

    // Google Calendar API initialisieren
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: session.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth });

    console.log(`📅 Creating calendar event: ${eventData.summary}`);
    console.log(`📅 Start: ${eventData.start.dateTime}`);
    console.log(`📅 End: ${eventData.end.dateTime}`);

    // Event erstellen
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description || '',
        start: eventData.start,
        end: eventData.end,
        colorId: eventData.colorId || '4', // Blau als Standard
        extendedProperties: {
          private: {
            source: 'todo-app',
            type: 'work-block'
          }
        }
      },
    });

    console.log(`✅ Calendar event created with ID: ${response.data.id}`);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create calendar event", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
