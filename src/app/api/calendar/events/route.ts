import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Prüfe auf Auth-Fehler (z.B. abgelaufenes Refresh Token)
    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Token expired", reason: "token_expired" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    
    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Google Calendar API initialisieren
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: session.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Start und Ende des Tages berechnen (lokale Zeitzone berücksichtigen)
    const inputDate = new Date(date + 'T00:00:00'); // Explizit lokale Zeit
    
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📅 Loading events for date: ${date}`);
    console.log(`📅 Start of day (local): ${startOfDay.toLocaleString()}`);
    console.log(`📅 End of day (local): ${endOfDay.toLocaleString()}`);
    console.log(`📅 Start of day (ISO): ${startOfDay.toISOString()}`);
    console.log(`📅 End of day (ISO): ${endOfDay.toISOString()}`);

    // Events für den Tag abrufen
    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      });

      const events = response.data.items?.map((event) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        
        return {
          id: event.id,
          title: event.summary || "Untitled Event",
          start: start ? new Date(start) : new Date(),
          end: end ? new Date(end) : new Date(),
          location: event.location || undefined,
          description: event.description || undefined,
          isAllDay: !event.start?.dateTime,
          htmlLink: event.htmlLink || undefined,
          conferenceData: event.conferenceData?.entryPoints?.[0] ? {
            type: event.conferenceData.entryPoints[0].entryPointType || "video",
            uri: event.conferenceData.entryPoints[0].uri || "",
          } : undefined,
        };
      }) || [];

      return NextResponse.json({ events });
    } catch (calendarError: unknown) {
      console.error("Google Calendar API error:", calendarError);
      
      // Handle specific Google API errors
      const error = calendarError as { code?: number };
      if (error.code === 401) {
        return NextResponse.json(
          { error: "Token invalid", reason: "token_invalid" },
          { status: 401 }
        );
      }
      
      if (error.code === 403) {
        return NextResponse.json(
          { error: "Insufficient permissions", reason: "insufficient_scope" },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: "Google Calendar API error", reason: "api_error" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
