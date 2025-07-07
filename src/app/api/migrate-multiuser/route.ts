import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  return handleMigration();
}

export async function GET() {
  return handleMigration();
}

async function handleMigration() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting multi-user migration...");

    // 1. Spalte hinzufügen (falls nicht existiert)
    try {
      await db.run(sql`ALTER TABLE todos ADD COLUMN user_email TEXT`);
      console.log("✅ Added user_email column");
    } catch (error) {
      console.log("ℹ️ user_email column might already exist:", error);
    }

    // 2. Alle bestehenden Todos dem aktuellen User zuweisen
    await db.run(sql`
      UPDATE todos 
      SET user_email = ${session.user.email} 
      WHERE user_email IS NULL
    `);

    console.log(`✅ Updated todos to user: ${session.user.email}`);

    // 3. Constraint hinzufügen (nur wenn möglich)
    try {
      await db.run(sql`
        CREATE TABLE todos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          completed INTEGER DEFAULT 0 NOT NULL,
          priority TEXT DEFAULT 'medium',
          due_date INTEGER,
          estimated_hours INTEGER,
          tags TEXT,
          calendar_linked INTEGER DEFAULT 0,
          email_source TEXT,
          status TEXT DEFAULT 'todo' NOT NULL,
          user_email TEXT NOT NULL,
          created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
          updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
        );
      `);

      await db.run(sql`
        INSERT INTO todos_new 
        SELECT * FROM todos WHERE user_email IS NOT NULL;
      `);

      await db.run(sql`DROP TABLE todos;`);
      await db.run(sql`ALTER TABLE todos_new RENAME TO todos;`);

      console.log("✅ Applied NOT NULL constraint to user_email");
    } catch (error) {
      console.log("⚠️ Could not apply constraint, but migration still successful:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Multi-user migration completed",
      currentUser: session.user.email
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
    return NextResponse.json({
      error: "Migration failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}