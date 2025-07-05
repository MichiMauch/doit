/**
 * Google Calendar API Integration
 * 
 * Diese Datei enthält die Logik für die Integration mit der Google Calendar API.
 * 
 * Setup-Schritte:
 * 1. Google Cloud Console: https://console.cloud.google.com/
 * 2. Neues Projekt erstellen oder vorhandenes auswählen
 * 3. Calendar API aktivieren
 * 4. OAuth 2.0 Credentials erstellen
 * 5. Authorized redirect URIs hinzufügen: http://localhost:3000/api/auth/callback/google
 * 6. Client ID und Client Secret zu .env.local hinzufügen
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  isAllDay?: boolean;
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  conferenceData?: {
    type: string;
    uri: string;
  };
  htmlLink?: string;
}

export class GoogleCalendarService {
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar'
  ];

  /**
   * Events für ein bestimmtes Datum abrufen
   */
  static async getEventsForDate(date: Date, useRealAPI: boolean = false): Promise<CalendarEvent[]> {
    if (!useRealAPI) {
      // Keine Mock-Daten mehr - wenn keine echten Events geladen werden können, gib leere Liste zurück
      console.log('📅 Real API disabled - returning empty events list');
      return [];
    }

    try {
      // Datum in lokaler Zeitzone formatieren (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log(`🔍 Requesting events for date: ${dateString} (from ${date.toDateString()})`);
      
      const response = await fetch(`/api/calendar/events?date=${dateString}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Nicht authentifiziert - leere Liste zurückgeben
          console.log('🔐 Not authenticated, returning empty events list');
          return [];
        }
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const events = data.events || []; // API gibt { events: [...] } zurück
      console.log(`📋 Received ${events.length} events from API`);
      
      // Validiere dass events ein Array ist
      if (!Array.isArray(events)) {
        console.error('❌ Events is not an array:', events);
        return [];
      }
      
      return events.map((event: CalendarEvent) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      // Bei Fehlern leere Liste zurückgeben
      return [];
    }
  }

  /**
   * Prüft ob der Benutzer für Google Calendar authentifiziert ist
   */
  static async checkAuthentication(): Promise<{ authenticated: boolean; reason?: string; message?: string }> {
    try {
      const response = await fetch('/api/calendar/auth-check', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        return {
          authenticated: false,
          reason: data.reason || 'unknown',
          message: data.message || 'Authentifizierung fehlgeschlagen'
        };
      }
      
      return { authenticated: true };
    } catch (error) {
      console.error('Error checking authentication:', error);
      return { 
        authenticated: false, 
        reason: 'network_error',
        message: 'Netzwerkfehler bei Authentifizierungsprüfung'
      };
    }
  }

  /**
   * URL für Google OAuth-Authentifizierung generieren
   */
  static getAuthUrl(): string {
    // TODO: Echte OAuth URL generieren
    return "/api/auth/google";
  }

  /**
   * Erstellt ein neues Event im Google Calendar
   */
  static async createEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    colorId?: string;
  }): Promise<CalendarEvent | null> {
    try {
      console.log('🗓️ Creating calendar event:', eventData);
      
      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        
        if (response.status === 401) {
          console.warn('🔐 Not authenticated for Google Calendar');
          return null; // Nicht authentifiziert - kein Event erstellen
        }
        
        if (errorData.includes('insufficient authentication scopes')) {
          console.error('🔒 Insufficient scopes: Neu-Anmeldung erforderlich');
          console.error('💡 Lösung: Abmelden und neu anmelden für Kalender-Schreibberechtigung');
          // Return null statt Error zu werfen, damit das System graceful handled
          return null;
        }
        
        throw new Error(`Failed to create calendar event: ${response.status} ${errorData}`);
      }

      const createdEvent = await response.json();
      console.log('✅ Calendar event created successfully:', createdEvent.id);
      
      return {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: new Date(createdEvent.start.dateTime),
        end: new Date(createdEvent.end.dateTime),
        description: createdEvent.description,
        htmlLink: createdEvent.htmlLink,
      };
    } catch (error) {
      console.error('💥 Error creating calendar event:', error);
      return null; // Graceful failure - kein Event erstellen statt Fehler werfen
    }
  }

  /**
   * Events für einen Datumsbereich abrufen
   */
  static async getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const startParam = startDate.toISOString().split('T')[0];
      const endParam = endDate.toISOString().split('T')[0];
      
      console.log(`📅 Google Calendar API Aufruf: ${startParam} bis ${endParam}`);
      
      // Absolute URL für Server-side requests
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/calendar/events-range?start=${startParam}&end=${endParam}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Google Calendar nicht authentifiziert - bitte anmelden');
          throw new Error('Google Calendar authentication required');
        }
        const errorText = await response.text();
        console.error(`❌ Google Calendar API Fehler: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch calendar events: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📅 ${data.events?.length || 0} Events von Google Calendar erhalten`);
      return data.events || [];
    } catch (error) {
      console.error('❌ Error fetching calendar events range:', error);
      // Werfe den Fehler weiter statt auf Mock-Daten zurückzufallen
      throw error;
    }
  }

  /**
   * Kalendertermin löschen
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/calendar/delete-event', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Failed to delete calendar event:', errorData);
        
        if (response.status === 401) {
          console.error('🔒 Authentication error: Abmeldung und Neu-Anmeldung erforderlich');
          return false;
        }
        
        if (errorData.includes('insufficient authentication scopes')) {
          console.error('🔒 Insufficient scopes: Neu-Anmeldung erforderlich');
          console.error('💡 Lösung: Abmelden und neu anmelden für Kalender-Schreibberechtigung');
          return false;
        }
        
        throw new Error(`Failed to delete calendar event: ${response.status} ${errorData}`);
      }

      console.log('✅ Calendar event deleted successfully:', eventId);
      return true;
    } catch (error) {
      console.error('💥 Error deleting calendar event:', error);
      return false; // Graceful failure
    }
  }
}
