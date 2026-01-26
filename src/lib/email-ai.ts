/**
 * AI-gestützte E-Mail-Zusammenfassung für Todo-Erstellung
 *
 * Nutzt OpenAI GPT-4o-mini um aus E-Mails sinnvolle Todo-Einträge zu generieren.
 */

import OpenAI from "openai";
import { type GmailMessage } from "./google-gmail";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface EmailSummary {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedHours: number | null;
  suggestedDueDate: Date | null;
}

const SYSTEM_PROMPT = `Du bist ein KI-Assistent für E-Mail-Triage und Aufgabenverwaltung.
Analysiere E-Mails und erstelle prägnante, umsetzbare Todo-Aufgaben auf Deutsch.
Deine Antwort muss immer gültiges JSON sein.

Regeln:
1. Titel: Kurz (max 80 Zeichen), beginne mit einem aktiven Verb (z.B. "Antworten auf...", "Prüfen:", "Vorbereiten:")
2. Beschreibung: Kontext aus der E-Mail, Absender, wichtige Details, nächste Schritte
3. Priorität: "high" nur für dringend/wichtig, "medium" ist Standard, "low" für nice-to-have
4. Zeitschätzung: Realistisch basierend auf Aufgabenkomplexität (kann null sein)
5. Fälligkeitsdatum: Nur setzen wenn explizit in der E-Mail erwähnt (ISO format YYYY-MM-DD, kann null sein)`;

function buildUserPrompt(email: GmailMessage): string {
  const bodyTruncated = email.body.substring(0, 2000);

  return `Erstelle eine Todo-Aufgabe aus dieser E-Mail:

BETREFF: ${email.subject}
VON: ${email.from}
DATUM: ${email.date.toLocaleDateString("de-DE")}

INHALT:
${bodyTruncated}

Antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "title": "string (max 80 Zeichen, aktives Verb)",
  "description": "string (Kontext, Absender, nächste Schritte)",
  "priority": "low" | "medium" | "high",
  "estimatedHours": number | null,
  "suggestedDueDate": "YYYY-MM-DD" | null
}`;
}

function parseSummaryResponse(raw: string): EmailSummary {
  // Entferne mögliche Markdown-Code-Blöcke
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const data = JSON.parse(cleaned);

  // Validiere und bereinige
  const title = typeof data.title === "string" ? data.title.substring(0, 80) : "E-Mail bearbeiten";
  const description = typeof data.description === "string" ? data.description : "";
  const priority = ["low", "medium", "high"].includes(data.priority) ? data.priority : "medium";
  const estimatedHours = typeof data.estimatedHours === "number" ? data.estimatedHours : null;

  let suggestedDueDate: Date | null = null;
  if (data.suggestedDueDate) {
    const parsed = new Date(data.suggestedDueDate);
    if (!isNaN(parsed.getTime())) {
      suggestedDueDate = parsed;
    }
  }

  return { title, description, priority, estimatedHours, suggestedDueDate };
}

function createFallbackSummary(email: GmailMessage): EmailSummary {
  const title = email.subject.length > 80
    ? email.subject.substring(0, 77) + "..."
    : email.subject || "E-Mail bearbeiten";

  const description = [
    `Von: ${email.from}`,
    `Datum: ${email.date.toLocaleDateString("de-DE")}`,
    "",
    email.body.substring(0, 500),
  ].join("\n");

  return {
    title,
    description,
    priority: "medium",
    estimatedHours: null,
    suggestedDueDate: null,
  };
}

export class EmailAIService {
  /**
   * Erstellt eine AI-Zusammenfassung einer E-Mail als Todo
   */
  static async summarizeEmail(email: GmailMessage): Promise<EmailSummary> {
    if (!openai) {
      console.warn("[EmailAI] OpenAI nicht konfiguriert - verwende Fallback");
      return createFallbackSummary(email);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(email) },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Keine Antwort von OpenAI erhalten");
      }

      return parseSummaryResponse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[EmailAI] Fehler bei AI-Zusammenfassung:", message);
      return createFallbackSummary(email);
    }
  }
}
