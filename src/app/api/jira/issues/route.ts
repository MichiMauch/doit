import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings, jiraIssues } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createJiraService } from "@/lib/jira";
import { createClient } from "@libsql/client";

async function ensureJiraTable() {
  try {
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
    }
  } catch (error) {
    console.error("Error ensuring Jira table:", error);
    // Continue - table might already exist
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure jira_issues table exists
    await ensureJiraTable();

    const userEmail = session.user.email;
    const { searchParams } = new URL(request.url);
    const projects = searchParams.get("projects")?.split(",") || [];
    const forceSync = searchParams.get("sync") === "true";

    // Get Jira configuration
    const jiraSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `jira_config_${userEmail}`));

    if (jiraSettings.length === 0) {
      return NextResponse.json(
        { error: "Jira not configured" },
        { status: 400 }
      );
    }

    const config = JSON.parse(jiraSettings[0].value);
    const jiraService = createJiraService(config);

    // If force sync or no cached data, fetch from Jira
    if (forceSync) {
      const issues = await jiraService.getIssuesByProjects(projects);
      
      // Clear existing issues for this user and these projects
      if (projects.length > 0) {
        for (const project of projects) {
          await db
            .delete(jiraIssues)
            .where(and(
              eq(jiraIssues.project, project),
              eq(jiraIssues.userEmail, userEmail)
            ));
        }
      }

      // Insert new issues
      for (const issue of issues) {
        await db
          .insert(jiraIssues)
          .values({
            ...issue,
            userEmail,
          })
          .onConflictDoUpdate({
            target: jiraIssues.jiraId,
            set: {
              summary: issue.summary,
              description: issue.description,
              status: issue.status,
              priority: issue.priority,
              assignee: issue.assignee,
              dueDate: issue.dueDate,
              updatedAt: new Date(),
              lastSyncAt: new Date(),
            },
          });
      }
    }

    // Get issues from database
    const query = db
      .select()
      .from(jiraIssues)
      .where(eq(jiraIssues.userEmail, userEmail));

    const issues = await query;

    // Filter by projects if specified
    const filteredIssues = projects.length > 0 
      ? issues.filter(issue => projects.includes(issue.project))
      : issues;

    return NextResponse.json({
      issues: filteredIssues,
      lastSync: filteredIssues.length > 0 ? filteredIssues[0].lastSyncAt : null,
    });
  } catch (error) {
    console.error("Error fetching Jira issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure jira_issues table exists
    await ensureJiraTable();

    const userEmail = session.user.email;
    const { projects = [] } = await request.json();

    // Get Jira configuration
    const jiraSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `jira_config_${userEmail}`));

    if (jiraSettings.length === 0) {
      return NextResponse.json(
        { error: "Jira not configured" },
        { status: 400 }
      );
    }

    const config = JSON.parse(jiraSettings[0].value);
    const jiraService = createJiraService(config);

    // Fetch issues from Jira
    const issues = await jiraService.getIssuesByProjects(projects);

    // Clear existing issues for this user and these projects
    if (projects.length > 0) {
      for (const project of projects) {
        await db
          .delete(jiraIssues)
          .where(and(
            eq(jiraIssues.project, project),
            eq(jiraIssues.userEmail, userEmail)
          ));
      }
    }

    // Insert new issues
    for (const issue of issues) {
      await db
        .insert(jiraIssues)
        .values({
          ...issue,
          userEmail,
        })
        .onConflictDoUpdate({
          target: jiraIssues.jiraId,
          set: {
            summary: issue.summary,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            assignee: issue.assignee,
            dueDate: issue.dueDate,
            updatedAt: new Date(),
            lastSyncAt: new Date(),
          },
        });
    }

    return NextResponse.json({
      success: true,
      synced: issues.length,
    });
  } catch (error) {
    console.error("Error syncing Jira issues:", error);
    return NextResponse.json(
      { error: "Failed to sync Jira issues" },
      { status: 500 }
    );
  }
}