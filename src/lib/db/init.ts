import { db } from "./index";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Erstelle die Tabellen
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0 NOT NULL,
        priority TEXT DEFAULT 'medium',
        due_date INTEGER,
        tags TEXT,
        calendar_linked INTEGER DEFAULT 0,
        email_source TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3b82f6',
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);

    // Füge Standard-Tags hinzu
    const defaultTags = [
      { name: "Privat", color: "#3b82f6" },
      { name: "Arbeit", color: "#ef4444" },
      { name: "Projekt", color: "#f59e0b" },
      { name: "Einkaufen", color: "#10b981" },
      { name: "Wichtig", color: "#8b5cf6" },
    ];

    for (const tag of defaultTags) {
      try {
        await db.run(sql`
          INSERT OR IGNORE INTO tags (name, color) VALUES (${tag.name}, ${tag.color})
        `);
      } catch {
        // Ignoriere Fehler bei bereits vorhandenen Tags
      }
    }

    console.log("Database initialized successfully!");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}
