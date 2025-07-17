import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check if jira_issues table exists
    const tableCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='jira_issues'
    `);

    if (tableCheck.rows.length === 0) {
      // Create jira_issues table
      await client.execute(`
        CREATE TABLE jira_issues (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          jira_id TEXT NOT NULL,
          key TEXT NOT NULL,
          summary TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          priority TEXT,
          assignee TEXT,
          project TEXT NOT NULL,
          issue_type TEXT NOT NULL,
          due_date INTEGER,
          user_email TEXT NOT NULL,
          created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
          updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
          last_sync_at INTEGER DEFAULT (unixepoch()) NOT NULL
        )
      `);

      // Create unique index
      await client.execute(`
        CREATE UNIQUE INDEX jira_issues_jira_id_unique ON jira_issues (jira_id)
      `);

      return NextResponse.json({ 
        success: true, 
        message: "Jira issues table created successfully" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Jira issues table already exists" 
    });
  } catch (error) {
    console.error("Error creating Jira table:", error);
    return NextResponse.json(
      { error: "Failed to create Jira table" },
      { status: 500 }
    );
  }
}