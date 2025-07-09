export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.1.1",
    date: "2025-01-09",
    type: "patch",
    changes: [
      "📊 Added 'Completed Late' statistics feature to track overdue task completion",
      "🔧 Fixed weekly summary (Zusammenfassung) - now works without Google Calendar",
      "🧠 Enhanced AI workload analysis with graceful fallback handling",
      "⚡ Improved error handling for calendar integration",
      "📈 Better productivity metrics with punctuality tracking",
      "🎯 Statistics modal now shows tasks completed after due date",
      "🔨 Technical improvements for better system reliability"
    ]
  },
  {
    version: "1.1.0",
    date: "2025-01-08",
    type: "minor",
    changes: [
      "🎆 Complete fireworks celebration system for task completion",
      "🎯 Enhanced drag & drop with @dnd-kit - works for all status columns",
      "✨ Fireworks animation triggers for: checkbox, dropdown, and drag&drop",
      "🔧 Fixed Redux dependency issues by migrating to modern @dnd-kit",
      "🎨 Centralized celebration management prevents re-render issues",
      "📱 Fixed web app manifest syntax errors",
      "⚡ Performance improvements with optimized state management",
      "🔧 Clean drag & drop implementation with visual feedback",
      "🎉 3-4 second celebration animations with emojis and particles",
      "🚀 Production-ready drag & drop between all task columns"
    ]
  },
  {
    version: "1.0.0",
    date: "2024-07-08",
    type: "major",
    changes: [
      "🎨 Complete logo integration with custom doit-logo.png",
      "📱 Comprehensive app icons and favicon set for all platforms",
      "🔄 Automated version tracking with git-based changelog",
      "📊 Intelligent task sorting by priority and due date",
      "🌙 Enhanced dark mode support for all UI elements",
      "📱 Optimized mobile navigation layout",
      "🎨 Extended design system with complete icon showcase",
      "🚀 PWA-ready with web app manifest",
      "⚡ Performance improvements and build optimizations",
      "🔧 Mobile UI reorganization and theme toggle placement"
    ]
  },
  {
    version: "0.9.0", 
    date: "2024-07-07",
    type: "minor",
    changes: [
      "🔐 Complete multi-user implementation",
      "📧 Email-based authentication system",
      "🛡️ Comprehensive middleware and access control",
      "🔧 Fix migration endpoints and database handling",
      "📱 Enhanced Slack integration with access control",
      "🐛 Bug fixes for drag-and-drop functionality",
      "📊 Improved statistics and date filtering",
      "🔄 Database migration improvements"
    ]
  },
  {
    version: "0.8.0",
    date: "2024-07-06", 
    type: "minor",
    changes: [
      "🎨 Comprehensive dark mode support implementation",
      "🎯 Design system updates and improvements",
      "🔧 Authentication fixes for production environment",
      "📱 Slack integration enhancements",
      "🐛 Date parsing and display improvements",
      "⚡ Performance optimizations",
      "🔄 UI/UX improvements across components"
    ]
  },
  {
    version: "0.7.0",
    date: "2024-07-05",
    type: "minor", 
    changes: [
      "🚀 Initial release with core functionality",
      "✅ Todo management with drag-and-drop",
      "📊 Statistics and analytics features",
      "🤖 Smart suggestions with AI integration",
      "📅 Calendar integration",
      "📱 Mobile-responsive design",
      "🎨 Custom design system implementation",
      "🔧 Database setup and ORM integration"
    ]
  }
];

export const getLatestVersion = (): string => {
  return changelog[0]?.version || "1.0.0";
};

export const getChangelogByVersion = (version: string): ChangelogEntry | undefined => {
  return changelog.find(entry => entry.version === version);
};

export const getRecentChanges = (limit: number = 10): ChangelogEntry[] => {
  return changelog.slice(0, limit);
};