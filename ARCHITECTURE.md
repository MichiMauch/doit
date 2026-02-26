# DOIT — Technische Architektur

## Übersicht

DOIT ist eine Task-Management-App mit Slack-Integration, REST API und Web-Frontend. Todos können via Slack Slash Command, Web-UI, Gmail oder API erstellt und verwaltet werden.

## Architektur

```
Slack Workspace                    Vercel (Next.js 15)                  Turso (LibSQL)
┌─────────────┐    POST            ┌──────────────────────┐             ┌──────────┐
│ /todo CMD   │───────────────────▶│ /api/slack/todo      │────────────▶│ SQLite   │
│             │  x-www-form-urlenc │ (Signature Verify)   │  Drizzle   │ (Edge)   │
│             │◀───────────────────│ (Date Parser)        │            │          │
│  ephemeral  │    JSON Response   │ (Auth Check)         │            │          │
└─────────────┘                    ├──────────────────────┤            │          │
                                   │ /api/todos           │◀──────────▶│          │
                curl / Frontend    │ (REST API + API Key) │  Drizzle   │          │
               ◀──────────────────▶│                      │            │          │
                                   ├──────────────────────┤            │          │
                                   │ /api/slack           │            │          │
                OAuth Callback     │ (OAuth2 Code Exchange│            │          │
               ◀──────────────────▶│  for App Install)    │            └──────────┘
                                   └──────────────────────┘
```

## Stack

| Layer | Technologie |
|-------|-------------|
| Runtime | Next.js 15 App Router auf Vercel (Serverless) |
| DB | Turso (LibSQL — verteiltes SQLite am Edge) |
| ORM | Drizzle ORM mit typisiertem Schema |
| Auth (Web) | NextAuth v4 mit Google OAuth |
| Auth (API) | API Key via `x-api-key` Header |
| Auth (Slack) | HMAC-SHA256 Signature Verification |

## Datenfluss: Slack → Todo

Wenn jemand in Slack `/todo Meeting vorbereiten | Agenda klären` eingibt, passiert folgendes:

1. **Slack schickt einen POST-Request** an `https://doit.mauch.rocks/api/slack/todo`. Der Body ist `application/x-www-form-urlencoded` und enthält den Text, den Usernamen, den Channel und Signatur-Header.

2. **Die Route verifiziert den Request** — sie nimmt den Body + Timestamp, berechnet einen HMAC-SHA256 Hash mit dem Slack Signing Secret und vergleicht ihn mit der mitgeschickten Signatur. Stimmt's nicht überein → 401.

3. **User/Channel-Check** — sie prüft ob der Slack-Username in der Allowlist steht (`SLACK_ALLOWED_USERS`).

4. **Text wird geparst** — der String wird am `|` gesplittet: links Titel (inkl. optionalem Datum), rechts Beschreibung. Dann laufen Regex-Patterns über den Titel-Teil um ein allfälliges Datum rauszulösen.

5. **User-Mapping** — der Slack-Username wird auf eine E-Mail-Adresse gemappt. Das ist der Schlüssel für Multi-Tenancy — alle Todos sind an eine E-Mail gebunden, egal ob sie via Web, Slack, Gmail oder API reinkommen.

6. **DB-Insert** — via Drizzle ORM wird ein INSERT auf die Turso-Datenbank (gehostetes SQLite) gemacht mit Titel, Beschreibung, Datum, Priority und der E-Mail.

7. **Slack bekommt eine JSON-Response** zurück — eine ephemeral Message (nur der Absender sieht sie) mit Bestätigung, dem Titel, Beschreibung, Datum und einem Button-Link zur Web-App.

Das Ganze dauert wenige hundert Millisekunden weil alles serverless auf Vercel läuft und Turso SQLite am Edge ist.

## Slack Slash Command

**Route:** `src/app/api/slack/todo/route.ts`

### Format

```
/todo <titel> [DD.MM[.YYYY] [HH:MM]] [| <beschreibung>]
```

### Beispiele

```
/todo Meeting vorbereiten
/todo Meeting vorbereiten | Agenda und Teilnehmer klären
/todo Report schreiben 08.07.2025 | Quartalszahlen zusammenfassen
/todo Präsentation 15.03.2026 14:30
```

### Datum-Parser

Der Parser arbeitet mit einer Regex-Kaskade (4 Patterns, spezifischstes zuerst):

```typescript
/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/  // DD.MM.YYYY HH:MM
/(\d{1,2})\.(\d{1,2})\.(\d{4})/                         // DD.MM.YYYY
/(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})/             // DD.MM HH:MM
/(\d{1,2})\.(\d{1,2})/                                   // DD.MM
```

### Security

```typescript
// Slack signiert jeden Request mit HMAC-SHA256
const baseString = `v0:${timestamp}:${body}`;
const expected = `v0=${crypto
  .createHmac("sha256", SLACK_SIGNING_SECRET)
  .update(baseString)
  .digest("hex")}`;
```

Plus Allowlists für User und Channels via `SLACK_ALLOWED_USERS` / `SLACK_ALLOWED_CHANNELS`.

## REST API

**Route:** `src/app/api/todos/route.ts`

### Dual-Auth Pattern

Gleich für GET und POST — unterstützt sowohl Browser-Sessions als auch API Keys:

```typescript
// 1. Machine-Auth via API Key
const isAuthorizedMachine = request.headers.get('x-api-key') === process.env.CRON_SECRET;

// 2. Human-Auth via NextAuth Session
const session = await getServerSession(authOptions);

// 3. userEmail aus der jeweiligen Quelle
if (isAuthorizedMachine) userEmail = process.env.CRON_USER_EMAIL;
else if (session?.user?.email) userEmail = session.user.email;
```

### Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/api/todos?filter=all&status=todo,in_progress` | Todos abrufen mit Zeit- und Status-Filter |
| POST | `/api/todos` | Neues Todo erstellen |
| GET | `/api/todos/[id]` | Einzelnes Todo abrufen |
| PATCH | `/api/todos/[id]` | Todo aktualisieren |
| DELETE | `/api/todos/[id]` | Todo löschen |
| PATCH | `/api/todos/[id]/toggle` | Completion toggling |
| GET | `/api/todos/stats` | Statistiken |

### Status-Filter

```
GET /api/todos?status=todo,in_progress&filter=week
```

Wird auf DB-Ebene via Drizzle `inArray()` umgesetzt:

```typescript
static async getTodos(
  filter?: "today" | "week" | "all",
  userEmail?: string,
  statusFilter?: ("todo" | "in_progress" | "done")[]
)

if (statusFilter?.length > 0) {
  whereConditions.push(inArray(todos.status, statusFilter));
}
```

Type-Safety: Der Query-Parameter wird gegen ein `const`-Array validiert und via Type Guard gefiltert:

```typescript
const validStatuses = ["todo", "in_progress", "done"] as const;
statusParam.split(",").filter(
  (s): s is "todo" | "in_progress" | "done" =>
    (validStatuses as readonly string[]).includes(s)
);
```

## OAuth Callback

**Route:** `src/app/api/slack/route.ts`

Für die Workspace-Installation der Slack App:

```
Slack → redirect zu /api/slack?code=XXX
     → Code-Exchange gegen https://slack.com/api/oauth.v2.access
     → Erfolgsseite anzeigen
```

## Datenmodell

```sql
todos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  description     TEXT,
  completed       BOOLEAN DEFAULT false,
  priority        TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
  status          TEXT CHECK(status IN ('todo','in_progress','done')) DEFAULT 'todo',
  due_date        TIMESTAMP,
  estimated_hours INTEGER,
  tags            TEXT,            -- JSON string
  email_source    TEXT,            -- Gmail integration
  calendar_linked BOOLEAN DEFAULT false,
  user_email      TEXT NOT NULL,   -- Multi-tenant via Email
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)
```

## Environment-Variablen

```bash
# Slack
SLACK_SIGNING_SECRET=...        # HMAC Verification
SLACK_CLIENT_ID=...             # OAuth App Install
SLACK_CLIENT_SECRET=...         # OAuth App Install
SLACK_ALLOWED_USERS=mm          # Allowlist (optional)
SLACK_ALLOWED_CHANNELS=...      # Allowlist (optional)

# API Auth
CRON_SECRET=...                 # API Key für externe Clients
CRON_USER_EMAIL=...             # Default-User für Machine-Auth
```

## Beispiel-Calls

```bash
# Todos mit Status-Filter abrufen
curl -H "x-api-key: $CRON_SECRET" \
  "https://doit.mauch.rocks/api/todos?status=todo,in_progress"

# Todo via API erstellen
curl -X POST -H "x-api-key: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","priority":"high"}' \
  "https://doit.mauch.rocks/api/todos"

# Slack Slash Command
/todo Deployment vorbereiten 28.02 | Staging testen und Release Notes schreiben
```

## Relevante Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/app/api/slack/todo/route.ts` | Slack Slash Command Handler |
| `src/app/api/slack/route.ts` | OAuth Callback für App-Installation |
| `src/app/api/todos/route.ts` | REST API (GET/POST) |
| `src/lib/db/schema.ts` | Drizzle Schema (todos, tags, settings, jiraIssues) |
| `src/lib/db/service.ts` | TodoService mit allen DB-Operationen |
| `src/lib/db/index.ts` | Turso/Drizzle DB-Verbindung |
| `SLACK_SETUP.md` | Slack App Setup-Anleitung |
