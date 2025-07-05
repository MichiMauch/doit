import { type CalendarEvent } from './google-calendar';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface TodoSuggestion {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  suggestions: string[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
}

export interface SmartSuggestionsRequest {
  lookbackDays?: number; // Standard: 0 Tage (nur heute und Zukunft)
  includeToday?: boolean; // Standard: true
  includeFuture?: boolean; // Standard: true - auch zukünftige Events
  futureDays?: number; // Standard: 4 Tage in die Zukunft
}

export class SmartSuggestionsService {
  /**
   * Generiert intelligente To-do-Vorschläge basierend auf Google Calendar Events
   */
  static async generateSuggestions(request: SmartSuggestionsRequest = {}): Promise<TodoSuggestion[]> {
    const { lookbackDays = 0, includeToday = true, includeFuture = true, futureDays = 4 } = request;

    try {
      // 1. Kalenderevents für den gewünschten Zeitraum laden
      const events = await this.getRelevantEvents(lookbackDays, includeToday, includeFuture, futureDays);
      
      if (events.length === 0) {
        console.log('📅 Keine relevanten Events für Vorschläge gefunden');
        return [];
      }

      console.log(`📅 ${events.length} Events für Smart Suggestions gefunden`);

      // 2. Für jedes Event KI-Vorschläge generieren
      const suggestions: TodoSuggestion[] = [];
      
      for (const event of events) {
        try {
          const suggestion = await this.generateSuggestionForEvent(event);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (error) {
          console.error(`❌ Fehler bei Vorschlag für Event "${event.title}":`, error);
        }
      }

      console.log(`🧠 ${suggestions.length} Smart Suggestions generiert`);
      return suggestions;

    } catch (error) {
      console.error('❌ Fehler beim Generieren von Smart Suggestions:', error);
      throw new Error('Failed to generate smart suggestions');
    }
  }

  /**
   * Lädt relevante Events für den Zeitraum
   */
  private static async getRelevantEvents(lookbackDays: number, includeToday: boolean, includeFuture: boolean = true, futureDays: number = 4): Promise<CalendarEvent[]> {
    const now = new Date();
    const startDate = startOfDay(subDays(now, lookbackDays));
    
    // Endzeit abhängig von Parametern
    let endDate: Date;
    if (includeFuture && futureDays > 0) {
      // Bis zu den nächsten X Tagen in die Zukunft
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + futureDays);
      endDate = endOfDay(futureDate);
    } else if (includeToday) {
      // Nur bis Ende des heutigen Tages
      endDate = endOfDay(now);
    } else {
      // Nur gestern oder früher
      endDate = endOfDay(subDays(now, 1));
    }

    console.log(`📅 Lade Events von ${format(startDate, 'dd.MM.yyyy')} bis ${format(endDate, 'dd.MM.yyyy')} (${futureDays} Tage voraus)`);

    try {
      // Sammle Events für alle Tage im Zeitraum
      const allEvents: CalendarEvent[] = [];
      
      // Für jeden Tag im Zeitraum Events laden
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        try {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          console.log(`📅 Lade Events für: ${dateString}`);
          
          // Absolute URL für Server-side requests
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/calendar/events?date=${dateString}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.events && Array.isArray(data.events)) {
              allEvents.push(...data.events);
            }
          } else if (response.status === 401) {
            console.warn(`⚠️ Auth-Fehler beim Laden von Events für ${dateString} - möglicherweise abgelaufene Session`);
            // Bei Auth-Fehlern stoppen wir die Schleife, da alle weiteren Requests fehlschlagen werden
            break;
          } else {
            console.warn(`⚠️ Konnte Events für ${dateString} nicht laden: ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Fehler beim Laden von Events für ${format(currentDate, 'yyyy-MM-dd')}:`, error);
        }
        
        // Nächster Tag
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`📅 Gesamt ${allEvents.length} Events im Zeitraum gefunden`);

      // Filtere nur relevante Events (keine automatischen Events, Blocker etc.)
      const relevantEvents = allEvents.filter(event => this.isRelevantEvent(event));
      console.log(`📅 ${relevantEvents.length} relevante Events nach Filterung`);
      
      return relevantEvents;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Calendar Events:', error);
      // Statt zu crashen, gib leere Liste zurück
      return [];
    }
  }

  /**
   * Prüft ob ein Event für Vorschläge relevant ist
   */
  private static isRelevantEvent(event: CalendarEvent): boolean {
    if (!event.title) return false;

    const title = event.title.toLowerCase();
    // Ignoriere automatische/unwichtige Events
    const ignorePatterns = [
      'lunch', 'mittagspause', 'pause', 'break',
      'commute', 'fahrt', 'travel', 'reise',
      'blocked', 'gesperrt', 'busy', 'beschäftigt',
      'ooo', 'out of office', 'urlaub', 'vacation',
      'fokuszeit', 'focus time', 'deep work'
    ];
    const shouldIgnore = ignorePatterns.some(pattern => title.includes(pattern));
    if (shouldIgnore) return false;

    // Stelle sicher, dass start und end echte Date-Objekte sind
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);

    // Bevorzuge Events mit einer gewissen Dauer (mindestens 15 Minuten)
    const hasReasonableDuration = start && end && 
      (end.getTime() - start.getTime()) >= 15 * 60 * 1000;

    return hasReasonableDuration;
  }

  /**
   * Generiert KI-Vorschläge für ein einzelnes Event
   */
  private static async generateSuggestionForEvent(event: CalendarEvent): Promise<TodoSuggestion | null> {
    const prompt = this.buildPromptForEvent(event);

    try {
      const aiResponse = await this.callOpenAIForSuggestions(prompt);
      
      if (!aiResponse) {
        return null;
      }

      return {
        id: `suggestion_${event.id}_${Date.now()}`,
        eventId: event.id || '',
        eventTitle: event.title || 'Unbenannter Termin',
        eventDate: new Date(event.start || new Date()),
        suggestions: aiResponse.suggestions,
        reasoning: aiResponse.reasoning,
        priority: aiResponse.priority,
        estimatedHours: aiResponse.estimatedHours,
      };

    } catch (error) {
      console.error('❌ Fehler bei KI-Aufruf für Event:', error);
      return null;
    }
  }

  /**
   * Erstellt einen strukturierten Prompt für GPT
   */
  private static buildPromptForEvent(event: CalendarEvent): string {
    const eventDate = event.start ? format(new Date(event.start), 'EEEE, d. MMMM yyyy', { locale: de }) : 'Unbekanntes Datum';
    const eventTime = event.start ? format(new Date(event.start), 'HH:mm') : '';
    const duration = event.start && event.end ? 
      Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)) : null;

    const attendees = event.attendees?.map(a => a.email || a.displayName).filter(Boolean).join(', ') || 'keine Teilnehmer';
    
    // Bestimme ob Event in Zukunft oder Vergangenheit liegt
    const now = new Date();
    const eventStart = new Date(event.start || now);
    const isUpcoming = eventStart > now;
    
    return `Du bist ein persönlicher Produktivitätsassistent. Analysiere diesen Kalendertermin und schlage 1-3 konkrete To-do-Aufgaben ${isUpcoming ? 'zur Vorbereitung' : 'zur Nachbereitung'} vor:

**KALENDERTERMIN:**
- Titel: ${event.title || 'Unbenannt'}
- Datum: ${eventDate}${eventTime ? ` um ${eventTime}` : ''}${duration ? ` (${duration} Min.)` : ''}
- Ort: ${event.location || 'kein Ort angegeben'}
- Teilnehmer: ${attendees}
- Beschreibung: ${event.description || 'keine Details'}

**AUFGABE:**
Generiere relevante ${isUpcoming ? 'Vorbereitungs' : 'Nachbereitungs'}-Aufgaben. Berücksichtige:
- Art des Meetings (1:1, Team, Kundenmeeting, Workshop, etc.)
${isUpcoming ? 
  `- Recherche und Vorbereitung die nötig ist
- Unterlagen die zusammengestellt werden müssen  
- Agenda-Punkte die vorbereitet werden sollten
- Material oder Präsentationen die erstellt werden müssen` : 
  `- Mögliche Deliverables oder Follow-ups
- Dokumentation, die erstellt werden sollte
- Nächste Schritte, die eingeleitet werden müssen
- Vereinbarungen die umgesetzt werden sollten`}

**ANTWORT-FORMAT (JSON):**
{
  "suggestions": ["Aufgabe 1", "Aufgabe 2", "Aufgabe 3"],
  "reasoning": "Kurze Erklärung warum diese Aufgaben sinnvoll sind",
  "priority": "low|medium|high",
  "estimatedHours": 1.5
}

Antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text.`;
  }

  /**
   * Ruft OpenAI API für Vorschläge auf
   */
  private static async callOpenAIForSuggestions(prompt: string): Promise<{
    suggestions: string[];
    reasoning: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours?: number;
  } | null> {
    
    // Fallback auf regelbasierte Vorschläge wenn OpenAI nicht verfügbar
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key nicht verfügbar - verwende Fallback-Vorschläge');
      return this.getFallbackSuggestions();
    }

    try {
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein erfahrener Produktivitätsexperte, der aus Kalendereinträgen sinnvolle Follow-up-Aufgaben ableitet. Antworte immer im angegebenen JSON-Format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!completion.ok) {
        throw new Error(`OpenAI API Fehler: ${completion.status}`);
      }

      const data = await completion.json();
      const response = data.choices[0]?.message?.content;

      if (!response) {
        throw new Error('Keine Antwort von OpenAI erhalten');
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(response);
        
        // Validiere Response-Format
        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
          throw new Error('Ungültiges Response-Format von OpenAI');
        }

        return {
          suggestions: parsed.suggestions.slice(0, 3), // Max 3 Vorschläge
          reasoning: parsed.reasoning || 'KI-generierte Vorschläge',
          priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
          estimatedHours: typeof parsed.estimatedHours === 'number' ? parsed.estimatedHours : undefined,
        };

      } catch (parseError) {
        console.error('❌ Fehler beim Parsen der OpenAI-Antwort:', parseError);
        console.log('OpenAI Response:', response);
        return this.getFallbackSuggestions();
      }

    } catch (error) {
      console.error('❌ OpenAI API Fehler:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Fallback-Vorschläge wenn OpenAI nicht verfügbar ist
   */
  private static getFallbackSuggestions(): {
    suggestions: string[];
    reasoning: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours?: number;
  } {
    // Einfache regelbasierte Vorschläge
    const suggestions = [
      'Meeting-Notizen zusammenfassen und versenden',
      'Nächste Schritte und Verantwortlichkeiten definieren',
      'Follow-up Termin planen'
    ];

    return {
      suggestions,
      reasoning: 'Standardvorschläge für Meeting-Nachbereitung',
      priority: 'medium',
      estimatedHours: 1,
    };
  }

  /**
   * Prüft ob für ein Event bereits Vorschläge generiert wurden
   */
  static async hasExistingSuggestions(): Promise<boolean> {
    // TODO: Implementiere Check in Datenbank oder localStorage
    // um zu verhindern, dass für das gleiche Event mehrfach Vorschläge gemacht werden
    return false;
  }

  /**
   * Generiert Vorschläge aus bereits geladenen Events (client-seitig)
   */
  static async generateSuggestionsFromEvents(events: CalendarEvent[]): Promise<TodoSuggestion[]> {
    try {
      console.log(`📅 Generiere Vorschläge aus ${events.length} Events`);

      // Filtere nur relevante Events
      const relevantEvents = events.filter(event => this.isRelevantEvent(event));
      console.log(`📅 ${relevantEvents.length} relevante Events nach Filterung`);

      if (relevantEvents.length === 0) {
        console.log('📅 Keine relevanten Events für Vorschläge gefunden');
        return [];
      }

      // Für jedes Event KI-Vorschläge generieren
      const suggestions: TodoSuggestion[] = [];
      
      for (const event of relevantEvents) {
        try {
          const suggestion = await this.generateSuggestionForEvent(event);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (error) {
          console.error(`❌ Fehler bei Vorschlag für Event "${event.title}":`, error);
        }
      }

      console.log(`🧠 ${suggestions.length} Smart Suggestions generiert`);
      return suggestions;

    } catch (error) {
      console.error('❌ Fehler beim Generieren von Smart Suggestions aus Events:', error);
      throw new Error('Failed to generate smart suggestions from events');
    }
  }
}
