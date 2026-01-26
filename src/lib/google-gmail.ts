/**
 * Google Gmail API Integration
 *
 * Diese Datei enthält die Logik für die Integration mit der Gmail API.
 * Wird verwendet um E-Mails mit dem "DOIT"-Label als Todos zu verarbeiten.
 */

import { google } from "googleapis";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  body: string;
  snippet: string;
  date: Date;
}

const DOIT_LABEL_NAME = "DOIT";

/**
 * Erstellt einen authentifizierten Gmail-Client
 */
function createGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

/**
 * Entfernt HTML-Tags und dekodiert Entities
 */
function stripHtml(html: string): string {
  return html
    // Script- und Style-Blöcke komplett entfernen
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Zeilenumbrüche beibehalten
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    // Alle restlichen Tags entfernen
    .replace(/<[^>]*>/g, "")
    // HTML-Entities dekodieren
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Aufräumen
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extrahiert den Body aus dem Gmail-Message-Payload
 */
function extractBody(payload: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Einfacher Body ohne Parts
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  if (!payload.parts) return "";

  // Bevorzuge text/plain
  const textPart = payload.parts.find(
    (p: any) => p.mimeType === "text/plain" // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  if (textPart?.body?.data) {
    return Buffer.from(textPart.body.data, "base64url").toString("utf-8");
  }

  // Fallback auf text/html
  const htmlPart = payload.parts.find(
    (p: any) => p.mimeType === "text/html" // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  if (htmlPart?.body?.data) {
    const html = Buffer.from(htmlPart.body.data, "base64url").toString("utf-8");
    return stripHtml(html);
  }

  // Rekursiv in verschachtelten Parts suchen (multipart/alternative innerhalb multipart/mixed)
  for (const part of payload.parts) {
    if (part.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

export class GoogleGmailService {
  /**
   * Sucht die Label-ID für das "DOIT"-Label
   */
  static async getDoitLabelId(accessToken: string): Promise<string | null> {
    const gmail = createGmailClient(accessToken);

    const response = await gmail.users.labels.list({ userId: "me" });
    const label = response.data.labels?.find(
      (l) => l.name?.toUpperCase() === DOIT_LABEL_NAME
    );

    return label?.id || null;
  }

  /**
   * Holt alle E-Mails mit dem "DOIT"-Label
   */
  static async getDoitMessages(accessToken: string): Promise<GmailMessage[]> {
    const gmail = createGmailClient(accessToken);

    const labelId = await this.getDoitLabelId(accessToken);
    if (!labelId) {
      console.log(`[Gmail] Label "${DOIT_LABEL_NAME}" nicht gefunden`);
      return [];
    }

    // Message-IDs abrufen
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: [labelId],
      maxResults: 50,
    });

    const messageIds = (listResponse.data.messages || [])
      .map((m) => m.id)
      .filter((id): id is string => id != null);
    if (messageIds.length === 0) {
      return [];
    }

    console.log(`[Gmail] ${messageIds.length} E-Mails mit DOIT-Label gefunden`);

    // Vollständige Message-Details abrufen
    const messages: GmailMessage[] = [];
    for (const messageId of messageIds) {
      try {
        const msg = await this.getMessage(messageId, accessToken);
        messages.push(msg);
      } catch (error) {
        console.error(`[Gmail] Fehler beim Abrufen von Message ${messageId}:`, error);
      }
    }

    return messages;
  }

  /**
   * Holt die vollständigen Details einer E-Mail
   */
  static async getMessage(messageId: string, accessToken: string): Promise<GmailMessage> {
    const gmail = createGmailClient(accessToken);

    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = response.data.payload?.headers || [];

    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "(Kein Betreff)";
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
    const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date")?.value;

    const body = extractBody(response.data.payload);
    const snippet = response.data.snippet || "";

    return {
      id: messageId,
      threadId: response.data.threadId || "",
      subject,
      from,
      body: body.substring(0, 5000), // Begrenze Body-Länge
      snippet,
      date: dateHeader ? new Date(dateHeader) : new Date(),
    };
  }

  /**
   * Entfernt das "DOIT"-Label von einer E-Mail
   */
  static async removeDoitLabel(messageId: string, labelId: string, accessToken: string): Promise<void> {
    const gmail = createGmailClient(accessToken);

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    console.log(`[Gmail] DOIT-Label entfernt von Message ${messageId}`);
  }
}
