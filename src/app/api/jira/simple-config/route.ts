import { NextRequest, NextResponse } from "next/server";
import { createJiraService } from "@/lib/jira";

// Simple localStorage-based config for testing
export async function POST(request: NextRequest) {
  try {
    const { url, email, token } = await request.json();

    if (!url || !email || !token) {
      return NextResponse.json(
        { error: "URL, email, and token are required" },
        { status: 400 }
      );
    }

    // Test the connection
    const jiraService = createJiraService({ url, email, token });
    const isConnected = await jiraService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Failed to connect to Jira. Please check your credentials." },
        { status: 400 }
      );
    }

    // Return the config for client-side storage
    return NextResponse.json({ 
      success: true, 
      config: { url, email, token } 
    });
  } catch (error) {
    console.error("Error testing Jira config:", error);
    return NextResponse.json(
      { error: "Failed to test Jira configuration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to test config" });
}