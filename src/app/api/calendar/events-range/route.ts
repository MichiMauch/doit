import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    
    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Start and end date parameters are required" },
        { status: 400 }
      );
    }

    // Google Calendar API initialisieren
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: session.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Datumsbereiche berechnen
    const startDate = startOfDay(new Date(startParam + 'T00:00:00'));
    const endDate = endOfDay(new Date(endParam + 'T00:00:00'));

    console.log(`📅 Loading events for range: ${startParam} to ${endParam}`);
    console.log(`📅 Start (ISO): ${startDate.toISOString()}`);
    console.log(`📅 End (ISO): ${endDate.toISOString()}`);

    // Events für den Bereich abrufen
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = response.data.items || [];
    console.log(`📅 Found ${events.length} events in range`);

    // Events formatieren
    const formattedEvents = events.map((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      
      return {
        id: event.id,
        title: event.summary || 'Kein Titel',
        start: new Date(start),
        end: new Date(end),
        location: event.location || null,
        description: event.description || null,
        isAllDay: !event.start?.dateTime, // Ganztägig wenn nur Datum ohne Zeit
        htmlLink: event.htmlLink || null,
        conferenceData: event.conferenceData ? {
          type: 'video',
          uri: event.conferenceData.entryPoints?.[0]?.uri || ''
        } : null
      };
    });

    return NextResponse.json({ 
      events: formattedEvents,
      count: formattedEvents.length 
    });
  } catch (error) {
    console.error("Error fetching calendar events range:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to fetch calendar events", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
