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

    const jiraService = createJiraService({ url, email, token });
    
    // Get issues
    const issues = await jiraService.getIssuesByProjects(projects);
    
    // Filter out completed issues and specific statuses
    const openIssues = issues.filter((issue) => {
      const status = issue.status.toLowerCase();
      const summary = issue.summary.toLowerCase();
      
      // Skip completed statuses
      if (status.includes("done") || 
          status.includes("closed") || 
          status.includes("resolved") ||
          status.includes("complete")) {
        return false;
      }
      
      // Skip "Ready to review" status
      if (status.includes("ready to review") || 
          status.includes("ready for review")) {
        return false;
      }
      
      // Skip "Release Notes" tasks
      if (summary.includes("release notes") || 
          summary.includes("release note")) {
        return false;
      }
      
      return true;
    });

    return NextResponse.json({
      success: true,
      issues: openIssues,
      total: openIssues.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching Jira issues:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch issues" },
      { status: 500 }
    );
  }
}