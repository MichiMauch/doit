import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    // Session validieren
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    // Request Body parsen
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Google Calendar API - Event löschen
    const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Calendar API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Spezifische Fehlerbehandlung
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: "Authentication failed", 
            details: "Session expired or invalid token",
            needsReauth: true 
          },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: "Insufficient permissions", 
            details: "Calendar write access required",
            needsReauth: true 
          },
          { status: 403 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: "Event not found", 
            details: "The calendar event does not exist or has already been deleted" 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: "Failed to delete calendar event",
          details: errorText || "Unknown error"
        },
        { status: response.status }
      );
    }

    // Erfolgreiche Löschung (204 No Content ist normal)
    return NextResponse.json({ 
      success: true, 
      message: "Calendar event deleted successfully",
      eventId 
    });

  } catch (error) {
    console.error("Unexpected error deleting calendar event:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
