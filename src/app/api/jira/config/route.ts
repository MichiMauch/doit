import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ configured: false });
    }

    const userEmail = session.user.email;
    const jiraSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `jira_config_${userEmail}`));

    if (jiraSettings.length === 0) {
      return NextResponse.json({ configured: false });
    }

    const config = JSON.parse(jiraSettings[0].value);
    return NextResponse.json({
      configured: true,
      url: config.url,
      email: config.email,
      // Don't return the token for security
    });
  } catch (error) {
    console.error("Error fetching Jira config:", error);
    return NextResponse.json({ configured: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, email, token } = await request.json();

    if (!url || !email || !token) {
      return NextResponse.json(
        { error: "URL, email, and token are required" },
        { status: 400 }
      );
    }

    console.log("Testing Jira connection for user:", session.user.email);

    // Test the connection
    const jiraService = createJiraService({ url, email, token });
    const isConnected = await jiraService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: "Failed to connect to Jira. Please check your credentials." },
        { status: 400 }
      );
    }

    // Store the configuration
    const userEmail = session.user.email;
    const config = JSON.stringify({ url, email, token });
    
    console.log("Saving Jira config for user:", userEmail);
    
    await db
      .insert(settings)
      .values({
        key: `jira_config_${userEmail}`,
        value: config,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: config,
          updatedAt: new Date(),
        },
      });

    console.log("Jira config saved successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving Jira config:", error);
    return NextResponse.json(
      { error: "Failed to save Jira configuration" },
      { status: 500 }
    );
  }
}