import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createJiraService } from "@/lib/jira";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

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

    // Fetch projects from Jira
    const projects = await jiraService.getProjects();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching Jira projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira projects" },
      { status: 500 }
    );
  }
}