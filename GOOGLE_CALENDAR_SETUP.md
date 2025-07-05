# Google Calendar Integration Setup

## Schritt 1: Google Cloud Console Setup

1. Gehe zu https://console.cloud.google.com/
2. Erstelle ein neues Projekt oder wähle ein vorhandenes aus
3. Aktiviere die Calendar API:
   - Navigiere zu "APIs & Services" > "Library"
   - Suche nach "Calendar API"
   - Klicke auf "Enable"

## Schritt 2: OAuth 2.0 Credentials erstellen

1. Gehe zu "APIs & Services" > "Credentials"
2. Klicke auf "Create Credentials" > "OAuth client ID"
3. Wähle "Web application"
4. Füge die folgenden Authorized redirect URIs hinzu:
   - http://localhost:3000/api/auth/callback/google
   - http://localhost:3001/api/auth/callback/google (Falls Port 3000 belegt ist)
   - https://yourdomain.com/api/auth/callback/google (Für Production)

## Schritt 3: Environment Variables

Füge folgende Variablen zu deiner .env.local Datei hinzu:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth.js (für Authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Optional: Spezifische Kalender-IDs
GOOGLE_CALENDAR_IDS=primary,calendar2@gmail.com
```

## Schritt 4: Abhängigkeiten installieren

```bash
npm install next-auth @next-auth/google-calendar-provider googleapis
```

## Schritt 5: NextAuth.js konfigurieren

Die Datei `pages/api/auth/[...nextauth].ts` oder `app/api/auth/[...nextauth]/route.ts` wird automatisch erstellt.

## Schritt 6: Erste Schritte

1. Starte den Development-Server: `npm run dev`
2. Öffne http://localhost:3000
3. Die Kalender-Komponente zeigt zunächst Mock-Daten an
4. Nach der vollständigen Konfiguration werden echte Google Calendar-Termine angezeigt

## Wichtige Hinweise

- **Scopes**: Die App benötigt nur Lesezugriff auf Kalender (`https://www.googleapis.com/auth/calendar.readonly`)
- **Rate Limits**: Google Calendar API hat Rate Limits - für Production sollte Caching implementiert werden
- **Datenschutz**: Kalenderdaten werden nicht gespeichert, nur zur Anzeige abgerufen
- **Offline-Modus**: Bei fehlender Internetverbindung werden keine Termine angezeigt

## Nächste Schritte für echte Integration

1. NextAuth.js Google Provider konfigurieren
2. API Route für Kalender-Events erstellen (`/api/calendar/events`)
3. Authentication State in der CalendarView-Komponente handhaben
4. Error Handling und Loading States verbessern
5. Caching für bessere Performance implementieren
