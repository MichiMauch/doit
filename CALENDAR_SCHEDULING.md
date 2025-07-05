# Automatische Kalendertermin-Erstellung 📅

## Überblick

Das automatische Scheduling-Feature erstellt automatisch Kalendertermine für deine Aufgaben basierend auf der Zeitschätzung und dem Fälligkeitsdatum.

## Funktionen

### ✨ Intelligente Zeitplanung

- **Große Aufgaben aufteilen**: Tasks über 4 Stunden werden automatisch in 2-4h Blöcke aufgeteilt
- **Deadline-bewusst**: Bei gesetztem Fälligkeitsdatum plant die App rückwärts vom Deadline
- **Arbeitszeiten beachten**: Termine werden nur während der Arbeitszeiten (Mo-Do, 08:45-12:00 und 13:15-17:00 Uhr) geplant
- **Mittagspause respektieren**: Keine Termine während der Mittagspause (12:00-13:15 Uhr)
- **Freie Tage auslassen**: Keine Termine an Freitagen, Samstagen und Sonntagen

### 🎯 Priorisierung

- **Farbcodierung**: Hohe Priorität = 🔴, Mittel = 🟡, Niedrig = 🟢
- **Intelligente Beschreibung**: Jeder Termin enthält Details zur ursprünglichen Aufgabe

### 📋 Anwendung

1. **Neue Aufgabe erstellen** mit Zeitschätzung
2. **"Automatisch Arbeitszeit im Kalender blockieren"** aktivieren
3. **Speichern** - die App erstellt automatisch die Termine

### 🔧 Beispiele

**Kleine Aufgabe (2h):**

- Erstellt einen 2h-Block

**Große Aufgabe (8h):**

- Wird in 2x 4h-Blöcke aufgeteilt
- Termine werden an verschiedenen Tagen geplant

**Mit Deadline:**

- 6h Aufgabe, Deadline in 3 Tagen
- Erstellt 2x 3h-Blöcke in den nächsten 2 Tagen

### ⚙️ Konfiguration

Die Standard-Einstellungen können in `calendar-scheduling.ts` angepasst werden:

```typescript
const DEFAULT_WORKING_HOURS = {
  start: 8.75, // 08:45 Uhr (8 + 45/60 = 8.75)
  end: 17, // 17:00 Uhr
};

const LUNCH_BREAK = {
  start: 12, // 12:00 Uhr
  end: 13.25, // 13:15 Uhr (13 + 15/60 = 13.25)
};

// Arbeitstage: Montag (1) bis Donnerstag (4)
// Freie Tage: Freitag (5), Samstag (6), Sonntag (0)
// Arbeitszeiten: 08:45-12:00 und 13:15-17:00

const DEFAULT_MAX_BLOCK_SIZE = 4; // Maximale Blockgröße in Stunden
const DEFAULT_MIN_BLOCK_SIZE = 0.5; // Minimale Blockgröße in Stunden
```

### 🚀 Technische Details

- **Konflikterkennung**: Berücksichtigt bestehende Kalendertermine
- **Google Calendar Integration**: Echte Termine in deinem Google Calendar
- **Rollback-sicher**: Bei Fehlern beim Scheduling wird das Todo trotzdem gespeichert
- **Zeitzone-bewusst**: Verwendet deine lokale Zeitzone
- **OAuth Scopes**: Benötigt `calendar` (nicht nur `calendar.readonly`) für Event-Erstellung

### 🔧 Setup & Troubleshooting

**Bei "insufficient authentication scopes" Fehlern:**

1. **Abmelden**: Klicke "Abmelden" in der Kalender-Sidebar
2. **Neu anmelden**: Klicke "Google" um dich neu anzumelden
3. **Berechtigungen bestätigen**: Google fragt nach Kalender-Schreibberechtigung
4. **Retry**: Versuche das automatische Scheduling erneut

**OAuth Scopes:**

- `https://www.googleapis.com/auth/calendar` - Volle Kalender-Berechtigung (BENÖTIGT)
- ~~`https://www.googleapis.com/auth/calendar.readonly`~~ - Nur Lesen (UNZUREICHEND)

### 📝 Limitierungen

- Benötigt Google Calendar-Authentifizierung für echte Termine
- Arbeitszeiten sind aktuell fest konfiguriert
- Berücksichtigt noch keine Feiertage
- Keine Rücksicht auf andere Teammitglieder oder geteilte Kalender
