# Slack Integration für DOIT - Setup Anleitung

## 🚀 Schnelle Todo-Erstellung via Slack

Mit der Slack Integration kannst du blitzschnell Todos erstellen:
```
/todo Meeting vorbereiten
/todo Präsentation fertigstellen
/todo E-Mails beantworten
```

## 📋 Setup Schritte

### 1. Slack App erstellen

1. Gehe zu https://api.slack.com/apps
2. Klicke "Create New App" → "From scratch"
3. App Name: **DOIT Todo Creator**
4. Workspace: Dein Slack Workspace

### 2. Slash Command konfigurieren

1. In deiner Slack App → **Slash Commands**
2. Klicke "Create New Command"
3. Konfiguration:
   ```
   Command: /todo
   Request URL: https://doit.mauch.rocks/api/slack/todo
   Short Description: Erstelle schnell eine neue Aufgabe
   Usage Hint: Meeting vorbereiten
   ```

### 3. Berechtigungen setzen

1. **OAuth & Permissions** → **Scopes**
2. Füge hinzu:
   - `commands` (Slash Commands verwenden)

### 4. App installieren

1. **Install App** → "Install to Workspace"
2. Autorisiere die App

### 5. Environment Variables

Füge zu Vercel Environment Variables hinzu:
```
SLACK_SIGNING_SECRET=dein_slack_signing_secret
```

Das Signing Secret findest du unter **Basic Information** → **App Credentials**.

## 🎯 Verwendung

Nach dem Setup kannst du in jedem Slack Channel schreiben:

```
/todo Projekt Review vorbereiten
```

Du bekommst eine Bestätigung und die Aufgabe wird in DOIT erstellt!

## ✨ Features

- ✅ **Slash Command** `/todo` in jedem Channel
- ✅ **Sofortige Bestätigung** mit Link zur App
- ✅ **Sichere Verifikation** über Slack Signing Secret
- ✅ **Kontext Information** (Erstellt von wem, in welchem Channel)
- ✅ **Fehlerbehandlung** bei Problemen

## 🔧 Troubleshooting

**Command funktioniert nicht:**
- Prüfe ob Request URL korrekt ist: `https://doit.mauch.rocks/api/slack/todo`
- Prüfe Environment Variable `SLACK_SIGNING_SECRET`

**403 Fehler:**
- Signing Secret falsch oder nicht gesetzt
- App Berechtigungen prüfen

**Teste die API:**
```bash
curl https://doit.mauch.rocks/api/slack/todo
```

## 🎨 Erweiterte Features (optional)

- **Interactive Buttons** für Priority setzen
- **Shortcuts** für häufige Todos
- **Calendar Integration** via Slack
- **Team Todos** für Channel-spezifische Aufgaben