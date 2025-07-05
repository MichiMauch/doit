# Vercel Deployment Setup für DOIT

## 1. Environment Variables in Vercel setzen

Gehe zu deinem Vercel Dashboard → Project Settings → Environment Variables und setze:

### Required Variables:
```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Access Control
ALLOWED_EMAIL=michi.mauch@netnode.ch

# Database
DATABASE_URL=your-turso-database-url
DATABASE_AUTH_TOKEN=your-turso-auth-token

# Optional
OPENAI_API_KEY=your-openai-api-key
```

## 2. Google OAuth Callback URLs

In der Google Cloud Console → Credentials → OAuth 2.0 Client IDs:

**Authorized redirect URIs hinzufügen:**
- `https://your-app.vercel.app/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/google` (für local dev)

## 3. NEXTAUTH_SECRET generieren

```bash
openssl rand -base64 32
```

Oder online: https://generate-secret.vercel.app/32

## 4. Deployment testen

1. Environment Variables setzen
2. Google OAuth URLs aktualisieren  
3. Vercel neu deployen
4. Authentication testen

## 5. Debug bei Problemen

- Vercel Function Logs checken
- Browser DevTools → Network → Check für Fehler
- `/debug` Seite aufrufen für Session-Info