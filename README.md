# Todo.Me - Persönliche Aufgabenverwaltung

Eine minimalistische, reaktionsschnelle und ästhetische Todo-App für Einzelpersonen, entwickelt mit Next.js 14+ und Tailwind CSS.

## 🌟 Features

### 📋 Kernfunktionalitäten

- **Intuitive Aufgabenverwaltung**: Erstellen, Bearbeiten, Markieren und Löschen von Aufgaben
- **Prioritätssystem**: Niedrig, Mittel, Hoch mit visuellen Indikatoren
- **Flexible Zeitplanung**: Fälligkeitsdatum und Uhrzeit für Aufgaben
- **Tag-System**: Organisiere Aufgaben mit benutzerdefinierten Tags
- **Smart Filtering**: Filter nach Heute, Woche oder Alle Aufgaben

### 🎨 Benutzeroberfläche

- **Responsive Design**: Optimiert für Desktop und Mobile
- **Moderne UI**: Gebaut mit Tailwind CSS und Radix UI Komponenten
- **Klare Hierarchie**: Überfällige, offene und erledigte Aufgaben getrennt dargestellt
- **Live-Statistiken**: Übersicht über Fortschritt und Produktivität

### 🔧 Technische Features

- **TypeScript**: Vollständig typisiert für bessere Entwicklererfahrung
- **Turso SQLite**: Schnelle, skalierbare Datenbank in der Cloud
- **Server Components**: Optimierte Performance mit Next.js App Router
- **Real-time Updates**: Sofortige UI-Updates bei Änderungen

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Turso Account und Datenbank

### 1. Repository klonen

```bash
git clone <repository-url>
cd todo.me2
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env.local` Datei mit:

```bash
# Turso Database Configuration
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Datenbank initialisieren

```bash
# Starte den Entwicklungsserver
npm run dev

# Initialisiere die Datenbank (einmalig)
curl -X POST http://localhost:3000/api/init
```

### 5. App verwenden

Öffne http://localhost:3000 in deinem Browser.

## 📱 Verwendung

### Neue Aufgabe erstellen

1. Klicke auf "Neue Aufgabe" Button
2. Fülle Titel, Beschreibung, Priorität und Fälligkeitsdatum aus
3. Füge Tags hinzu für bessere Organisation
4. Speichere die Aufgabe

### Aufgaben verwalten

- **Erledigen**: Checkbox anklicken
- **Bearbeiten**: Über das Drei-Punkte-Menü
- **Löschen**: Über das Drei-Punkte-Menü
- **Filtern**: Verwende die Filter-Buttons (Heute, Woche, Alle)

### Organisation

- **Tags**: Erstelle benutzerdefinierte Tags zur Kategorisierung
- **Prioritäten**: Setze Wichtigkeit (Niedrig, Mittel, Hoch)
- **Fälligkeitsdaten**: Plane Aufgaben für bestimmte Termine

## 🏗️ Architektur

### Frontend

- **Next.js 14+**: React Framework mit App Router
- **TypeScript**: Statische Typisierung
- **Tailwind CSS**: Utility-first CSS Framework
- **Radix UI**: Accessible UI Komponenten
- **Lucide React**: Moderne Icon Library

### Backend

- **API Routes**: Next.js Server-seitige API
- **Drizzle ORM**: Type-safe SQL Query Builder
- **Turso**: SQLite-kompatible Cloud-Datenbank

### Datenbankschema

```sql
-- Aufgaben
todos (
  id, title, description, completed, priority,
  due_date, tags, calendar_linked, email_source,
  created_at, updated_at
)

-- Tags
tags (id, name, color, created_at)

-- Einstellungen
settings (id, key, value, updated_at)
```

## 🔮 Geplante Erweiterungen

### Integrationen

- [ ] **Kalender-Sync**: Google Calendar, Outlook, CalDAV
- [ ] **E-Mail-Integration**: Aufgaben aus E-Mails erstellen
- [ ] **Benachrichtigungen**: Browser-Notifications für Erinnerungen

### Erweiterte Features

- [ ] **Wiederkehrende Aufgaben**: Daily/Weekly/Monthly Wiederholungen
- [ ] **Subtasks**: Aufgaben in kleinere Schritte unterteilen
- [ ] **Zeiterfassung**: Track Zeit für Aufgaben
- [ ] **Anhänge**: Dateien zu Aufgaben hinzufügen

### AI & Automation

- [ ] **Smart Suggestions**: KI-basierte Aufgabenvorschläge
- [ ] **Auto-Kategorisierung**: Automatisches Tagging
- [ ] **Sprachsteuerung**: Voice-to-Text für Aufgabenerstellung
- [ ] **Produktivitäts-Insights**: Analyse von Arbeitsmustern

### UI/UX Verbesserungen

- [ ] **Dark Mode**: Vollständige Dark Mode Unterstützung
- [ ] **Keyboard Shortcuts**: Schnelle Navigation per Tastatur
- [ ] **Bulk Operations**: Mehrere Aufgaben gleichzeitig bearbeiten
- [ ] **Drag & Drop**: Intuitive Reorganisation
- [ ] **Export/Import**: Backup und Migration

## 🛠️ Development

### Projekt starten

```bash
npm run dev          # Entwicklungsserver
npm run build        # Produktions-Build
npm run start        # Produktionsserver
npm run lint         # Code-Qualität prüfen
```

### Datenbank-Operationen

```bash
npx drizzle-kit generate    # Migrationen generieren
npx drizzle-kit push        # Schema zur DB pushen
npx drizzle-kit studio      # DB-Studio öffnen
```

### Code-Struktur

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── globals.css     # Globale Styles
│   ├── layout.tsx      # Root Layout
│   └── page.tsx        # Home Page
├── components/         # React Komponenten
│   ├── todo/          # Todo-spezifische Komponenten
│   └── ui/            # Wiederverwendbare UI Komponenten
├── lib/               # Utilities & Services
│   ├── db/            # Datenbank-Layer
│   └── utils.ts       # Helper Functions
└── dashboard.tsx      # Haupt-Dashboard
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist für private Nutzung gedacht. Alle Rechte vorbehalten.

## 🙏 Danksagungen

- **Vercel** - Hosting und Deployment Platform
- **Turso** - SQLite Cloud Database
- **Radix UI** - Accessible Component Primitives
- **Tailwind CSS** - Utility-first CSS Framework
- **Lucide** - Beautiful Icon Set

---

**Todo.Me** - Deine persönliche Produktivitätszentrale 🚀
