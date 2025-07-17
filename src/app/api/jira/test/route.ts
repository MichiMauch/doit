import { NextRequest, NextResponse } from "next/server";
import { createJiraService } from "@/lib/jira";

export async function POST(request: NextRequest) {
  try {
    const { url, email, token, projects = [] } = await request.json();

    if (!url || !email || !token) {
      return NextResponse.json(
        { error: "URL, email, and token are required" },
        { status: 400 }
      );
    }

    console.log("Testing Jira connection with:", { url, email, projects });

    // Test the connection
    const jiraService = createJiraService({ url, email, token });
    const isConnected = await jiraService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Failed to connect to Jira. Please check your credentials." },
        { status: 400 }
      );
    }

    // If connection works, try to fetch issues
    let issues: Awaited<ReturnType<typeof jiraService.getIssuesByProjects>> = [];
    if (projects.length > 0) {
      issues = await jiraService.getIssuesByProjects(projects);
    }

    return NextResponse.json({ 
      success: true, 
      connected: true,
      issuesCount: issues.length,
      issues: issues.slice(0, 3) // Show first 3 for testing
    });
  } catch (error) {
    console.error("Jira test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}