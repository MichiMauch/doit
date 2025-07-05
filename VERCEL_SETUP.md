# Vercel Setup für DOIT - Schritt-für-Schritt

## 1. Vercel Environment Variables setzen

**WICHTIG:** Du musst diese Environment Variables in deinem Vercel Dashboard setzen:

1. Gehe zu: https://vercel.com/michimauchs-projects/todo.me2/settings/environment-variables

2. Setze diese Variables (ALL ENVIRONMENTS):

```
NEXTAUTH_URL = https://todome2-dbstlx0qc-michimauchs-projects.vercel.app
NEXTAUTH_SECRET = [Generiere einen neuen Secret mit: openssl rand -base64 32]
GOOGLE_CLIENT_ID = [Dein Google Client ID]
GOOGLE_CLIENT_SECRET = [Dein Google Client Secret]
ALLOWED_EMAIL = michi.mauch@netnode.ch
DATABASE_URL = [Dein Turso Database URL]
DATABASE_AUTH_TOKEN = [Dein Turso Auth Token]
```

## 2. Google OAuth Callback URLs aktualisieren

Gehe zu Google Cloud Console → Credentials → OAuth 2.0 Client IDs:

**Authorized redirect URIs hinzufügen:**
```
https://todome2-dbstlx0qc-michimauchs-projects.vercel.app/api/auth/callback/google
```

## 3. Checklist zum Deployen

- [ ] Alle Environment Variables in Vercel gesetzt
- [ ] Google OAuth Callback URL hinzugefügt
- [ ] NEXTAUTH_URL auf production URL gesetzt
- [ ] Neuer NEXTAUTH_SECRET generiert
- [ ] Redeploy nach Environment Variable Änderungen

## 4. Debug Commands

Nach dem Deployment kannst du testen:

1. `/api/debug` aufrufen um Environment Variables zu checken
2. Vercel Function Logs checken: https://vercel.com/michimauchs-projects/todo.me2/functions

## 5. Häufige Probleme

- **Callback Loop:** NEXTAUTH_URL muss exakt der Production URL entsprechen
- **Unauthorized:** Google OAuth Callback URLs müssen korrekt sein
- **Environment Variables:** Nach Änderungen immer redeploy