import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false, reason: "no_session" },
        { status: 401 }
      );
    }

    // Prüfe auf Auth-Fehler (z.B. abgelaufenes Refresh Token)
    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { 
          authenticated: false, 
          reason: "token_expired",
          message: "Ihre Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an."
        },
        { status: 401 }
      );
    }
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { authenticated: false, reason: "no_token" },
        { status: 401 }
      );
    }

    // Test ob wir wirklich Kalender-Zugriff haben
    try {
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        // Timeout für bessere Performance
        signal: AbortSignal.timeout(5000),
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          return NextResponse.json({ 
            authenticated: false,
            reason: "token_invalid",
            message: "Google Access Token ungültig. Bitte melden Sie sich erneut an."
          }, { status: 401 });
        }
        
        if (testResponse.status === 403) {
          const errorData = await testResponse.json().catch(() => ({}));
          
          if (errorData.error?.message?.includes('insufficient') || 
              errorData.error?.message?.includes('scope')) {
            return NextResponse.json({ 
              authenticated: false,
              reason: "insufficient_scope",
              message: "Google Calendar Schreibberechtigungen fehlen. Bitte loggen Sie sich aus und wieder ein."
            }, { status: 403 });
          }
        }
        
        return NextResponse.json({ 
          authenticated: false,
          reason: "api_error",
          message: "Google Calendar API nicht erreichbar"
        }, { status: 503 });
      }

      return NextResponse.json({ 
        authenticated: true,
        user: session.user?.email,
        scopes: "calendar_read_write",
        tokenStatus: "valid"
      });
    } catch (calendarError) {
      console.error("Calendar API test failed:", calendarError);
      
      // Unterscheide zwischen Timeout und anderen Fehlern
      if (calendarError instanceof Error && calendarError.name === 'AbortError') {
        return NextResponse.json({ 
          authenticated: false,
          reason: "api_timeout",
          message: "Google Calendar antwortet nicht. Versuchen Sie es später erneut."
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        authenticated: false,
        reason: "calendar_test_failed",
        message: "Google Calendar Test fehlgeschlagen"
      }, { status: 503 });
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    return NextResponse.json(
      { authenticated: false, reason: "server_error", error: "Failed to check authentication" },
      { status: 500 }
    );
  }
}
