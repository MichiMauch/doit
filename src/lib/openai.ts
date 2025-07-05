import OpenAI from 'openai';
import { type Todo } from '@/lib/db/schema';
import { type CalendarEvent } from '@/lib/google-calendar';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface WorkloadAnalysisRequest {
  todos: Todo[];
  calendarEvents: CalendarEvent[];
  weekStart: Date;
  weekEnd: Date;
  availableWorkingHours: number;
  totalEstimatedHours: number;
}

export interface AIAnalysisResult {
  status: "optimal" | "busy" | "overloaded";
  workloadPercentage: number;
  recommendations: string[];
  priorities: string[];
  reschedulesSuggestions?: string[];
  risksIdentified: string[];
}

export class OpenAIService {
  /**
   * Analysiert die Workload mit ChatGPT und gibt intelligente Empfehlungen
   */
  static async analyzeWorkload(request: WorkloadAnalysisRequest): Promise<AIAnalysisResult> {
    // Fallback auf regelbasierte Analyse wenn kein API Key
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key nicht konfiguriert - verwende regelbasierte Analyse');
      return this.getRuleBasedAnalysis(request);
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Kostengünstigeres Modell
        messages: [
          {
            role: "system",
            content: `Du bist ein KI-Assistent für Produktivitäts- und Zeitmanagement. 
            Analysiere die Arbeitsbelastung und gib praktische, umsetzbare Empfehlungen auf Deutsch.
            Deine Antwort sollte im JSON-Format sein mit den Feldern: status, workloadPercentage, recommendations, priorities, reschedulesSuggestions, risksIdentified.
            Status kann "optimal", "busy" oder "overloaded" sein.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Keine Antwort von OpenAI erhalten');
      }

      // Parse JSON response
      try {
        const analysis = JSON.parse(response) as AIAnalysisResult;
        
        // Validiere und setze Defaults
        return {
          status: analysis.status || "busy",
          workloadPercentage: analysis.workloadPercentage || Math.round((request.totalEstimatedHours / request.availableWorkingHours) * 100),
          recommendations: analysis.recommendations || [],
          priorities: analysis.priorities || [],
          reschedulesSuggestions: analysis.reschedulesSuggestions || [],
          risksIdentified: analysis.risksIdentified || [],
        };
        
      } catch (parseError) {
        console.error('Fehler beim Parsen der OpenAI Antwort:', parseError);
        console.log('OpenAI Response:', response);
        
        // Fallback auf regelbasierte Analyse
        return this.getRuleBasedAnalysis(request);
      }

    } catch (error) {
      console.error('Fehler bei OpenAI API Aufruf:', error);
      
      // Fallback auf regelbasierte Analyse
      return this.getRuleBasedAnalysis(request);
    }
  }

  /**
   * Erstellt einen detaillierten Prompt für die KI-Analyse
   */
  private static buildAnalysisPrompt(request: WorkloadAnalysisRequest): string {
    const { todos, calendarEvents, weekStart, weekEnd, availableWorkingHours, totalEstimatedHours } = request;
    
    const workloadPercentage = Math.round((totalEstimatedHours / availableWorkingHours) * 100);
    
    // Kategorisiere Todos
    const highPriorityTodos = todos.filter(t => t.priority === 'high' && !t.completed);
    const todosWithoutEstimate = todos.filter(t => !t.estimatedHours && !t.completed);
    const todosWithoutDeadline = todos.filter(t => !t.dueDate && !t.completed);
    const urgentTodos = todos.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 2;
    });

    return `
Analysiere diese Arbeitsbelastung für die Woche vom ${weekStart.toLocaleDateString('de-DE')} bis ${weekEnd.toLocaleDateString('de-DE')}:

ARBEITSZEIT:
- Verfügbare Arbeitszeit: ${availableWorkingHours}h (Mo-Do, 08:45-12:00 & 13:15-17:00)
- Geschätzte benötigte Zeit: ${totalEstimatedHours}h
- Auslastung: ${workloadPercentage}%

OFFENE AUFGABEN (${todos.filter(t => !t.completed).length} gesamt):
${todos.filter(t => !t.completed).map(todo => 
  `- "${todo.title}" | Priorität: ${todo.priority} | Geschätzte Zeit: ${todo.estimatedHours || 'nicht angegeben'}h | Deadline: ${todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('de-DE') : 'keine'}`
).join('\n')}

BESTEHENDE TERMINE (${calendarEvents.length} gesamt):
${calendarEvents.map(event => 
  `- "${event.title}" | ${event.start ? new Date(event.start).toLocaleDateString('de-DE') + ' ' + new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Zeit unbekannt'}`
).join('\n')}

AUFFÄLLIGKEITEN:
- Hochpriorisierte Aufgaben: ${highPriorityTodos.length}
- Aufgaben ohne Zeitschätzung: ${todosWithoutEstimate.length}
- Aufgaben ohne Deadline: ${todosWithoutDeadline.length}
- Dringende Aufgaben (≤2 Tage): ${urgentTodos.length}

ARBEITSZEITEN: Montag bis Donnerstag, 08:45-12:00 und 13:15-17:00 (7h täglich, 28h/Woche)

Gib eine JSON-Antwort mit:
1. status: "optimal" (≤70%), "busy" (71-100%), "overloaded" (>100%)
2. workloadPercentage: Zahlenberechnung der Auslastung
3. recommendations: Array mit 3-5 konkreten Empfehlungen
4. priorities: Array mit priorisierten Aufgaben für diese Woche
5. reschedulesSuggestions: Array mit Vorschlägen für Umplanungen (falls nötig)
6. risksIdentified: Array mit identifizierten Risiken/Bottlenecks

Antworte NUR mit dem JSON, ohne zusätzlichen Text.
`;
  }

  /**
   * Regelbasierte Fallback-Analyse (wenn OpenAI nicht verfügbar)
   */
  private static getRuleBasedAnalysis(request: WorkloadAnalysisRequest): AIAnalysisResult {
    const { todos, availableWorkingHours, totalEstimatedHours } = request;
    const workloadPercentage = Math.round((totalEstimatedHours / availableWorkingHours) * 100);
    
    const recommendations: string[] = [];
    const priorities: string[] = [];
    const risksIdentified: string[] = [];
    
    // Status bestimmen
    let status: "optimal" | "busy" | "overloaded";
    if (workloadPercentage <= 70) {
      status = "optimal";
      recommendations.push("📅 Gute Auslastung! Sie haben noch Kapazität für spontane Aufgaben.");
    } else if (workloadPercentage <= 100) {
      status = "busy";
      recommendations.push("⚡ Hohe Auslastung. Planen Sie Pufferzeiten für unvorhergesehene Aufgaben ein.");
    } else {
      status = "overloaded";
      recommendations.push("🚨 Überlastung! Priorisieren Sie kritische Aufgaben und verschieben Sie andere.");
      risksIdentified.push("Arbeitszeit überschreitet verfügbare Kapazität");
    }

    // Spezifische Empfehlungen
    const todosWithoutEstimate = todos.filter(t => !t.estimatedHours && !t.completed);
    if (todosWithoutEstimate.length > 0) {
      recommendations.push(`⏱️ ${todosWithoutEstimate.length} Aufgaben ohne Zeitschätzung - fügen Sie Schätzungen hinzu`);
    }

    const highPriorityWithoutDeadline = todos.filter(t => t.priority === 'high' && !t.dueDate && !t.completed);
    if (highPriorityWithoutDeadline.length > 0) {
      recommendations.push(`📋 ${highPriorityWithoutDeadline.length} hochpriorisierte Aufgaben ohne Deadline`);
    }

    // Prioritäten setzen
    const urgentTodos = todos.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 2;
    });

    if (urgentTodos.length > 0) {
      priorities.push(`🔥 ${urgentTodos.length} dringende Aufgaben in den nächsten 2 Tagen`);
      risksIdentified.push("Mehrere Aufgaben mit sehr kurzfristigen Deadlines");
    }

    return {
      status,
      workloadPercentage,
      recommendations,
      priorities,
      reschedulesSuggestions: [],
      risksIdentified,
    };
  }

  /**
   * Prüft ob OpenAI API verfügbar ist
   */
  static isAvailable(): boolean {
    return !!openai && !!process.env.OPENAI_API_KEY;
  }
}
