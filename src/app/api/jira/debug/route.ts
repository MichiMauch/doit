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

    // Test 1: Connection test
    console.log("=== Test 1: Connection ===");
    const isConnected = await jiraService.testConnection();
    console.log("Connection result:", isConnected);

    if (!isConnected) {
      return NextResponse.json(
        { error: "Failed to connect to Jira" },
        { status: 400 }
      );
    }

    // Test 2: Get projects
    console.log("=== Test 2: Projects ===");
    try {
      const availableProjects = await jiraService.getProjects();
      console.log("Available projects:", availableProjects);
    } catch (error) {
      console.error("Projects error:", error);
    }

    // Test 3: Very simple JQL
    console.log("=== Test 3: Simple JQL ===");
    try {
      const simpleJql = "assignee = currentUser()";
      const simpleResponse = await fetch(`${url}/rest/api/2/search?jql=${encodeURIComponent(simpleJql)}&maxResults=5`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        console.log("Simple JQL result:", simpleData);
      } else {
        const errorText = await simpleResponse.text();
        console.error("Simple JQL error:", errorText);
      }
    } catch (error) {
      console.error("Simple JQL exception:", error);
    }

    // Test 4: Project-specific query (only if projects provided)
    if (projects.length > 0) {
      console.log("=== Test 4: Project Query ===");
      try {
        const projectJql = `project IN (${projects.map((p: string) => `"${p}"`).join(',')})`;
        console.log("Project JQL:", projectJql);
        
        const projectResponse = await fetch(`${url}/rest/api/2/search?jql=${encodeURIComponent(projectJql)}&maxResults=5`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          console.log("Project query result:", projectData);
        } else {
          const errorText = await projectResponse.text();
          console.error("Project query error:", errorText);
        }
      } catch (error) {
        console.error("Project query exception:", error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Check console for detailed debug output"
    });
  } catch (error) {
    console.error("Debug test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}