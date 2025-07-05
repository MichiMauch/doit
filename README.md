# DOIT - Private Task Management App

A powerful, private task management application built with Next.js, featuring Google Calendar integration, AI-powered suggestions, and a modern design system.

## 🚀 Features

- **Private Access Control**: Only authorized users can access the app
- **Google Calendar Integration**: Sync with your calendar events
- **AI-Powered Smart Suggestions**: Get intelligent task recommendations
- **Modern Design System**: Beautiful UI with Orange primary color and custom fonts
- **Responsive Design**: Works perfectly on desktop and mobile
- **Task Management**: Priority levels, status tracking, drag & drop
- **Design System Showcase**: View all components at `/design-system`

## 🔐 Security

This app is designed for **personal use only**. Access is controlled via:
- Google OAuth authentication
- Email whitelist (only your email address)
- All routes are protected by middleware

## 🛠️ Setup

### 1. Clone & Install

```bash
git clone git@github.com:MichiMauch/doit.git
cd doit
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# IMPORTANT: Add YOUR email address here
ALLOWED_EMAIL=your-email@gmail.com

# Database (LibSQL/Turso)
DATABASE_URL=your-database-url
DATABASE_AUTH_TOKEN=your-database-auth-token

# OpenAI (for smart suggestions)
OPENAI_API_KEY=your-openai-api-key
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google`
   - Your production domain callback URL

### 4. Database Setup

The app uses LibSQL (Turso) for the database:

1. Sign up at [Turso](https://turso.tech/)
2. Create a database
3. Get your DATABASE_URL and AUTH_TOKEN
4. Run migrations:

```bash
npm run db:push
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to access the app.

## 🎨 Design System

Visit `/design-system` to view all UI components and design tokens used throughout the application.

### Fonts Used
- **Audiowide**: App title "DOIT"
- **Red Hat Display**: All other text

### Color Scheme
- Primary: Orange (#FFA534)
- Success: Green
- Warning: Yellow
- Danger: Red
- Neutral: Gray scale

## 📱 Usage

1. **Sign In**: Use your authorized Google account
2. **Create Tasks**: Add tasks with priorities and due dates
3. **Manage Status**: Todo → In Progress → Done
4. **Calendar Integration**: View and sync with Google Calendar
5. **Smart Suggestions**: Get AI-powered task recommendations

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                 # Utilities and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript types
```

## 🚀 Deployment

The app can be deployed on Vercel, Netlify, or any platform supporting Next.js.

**Important**: Update your environment variables and redirect URIs for production!

## 📄 License

This is a private application for personal use.

---

Built with ❤️ using Next.js, NextAuth, Tailwind CSS, and modern web technologies.