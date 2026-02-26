import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?slack=error", request.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data.error);
      return NextResponse.redirect(new URL("/?slack=error", request.url));
    }

    console.log("✅ Slack app installed for team:", data.team?.name);

    // Redirect to success page
    return new NextResponse(
      `<!DOCTYPE html>
<html><head><title>DOIT - Slack verbunden</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0">
  <div style="text-align:center">
    <h1>Slack verbunden!</h1>
    <p>Du kannst jetzt <code>/todo</code> in Slack verwenden.</p>
    <a href="https://doit.mauch.rocks" style="color:#38bdf8">Zu DOIT &rarr;</a>
  </div>
</body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("Slack OAuth exchange failed:", err);
    return NextResponse.redirect(new URL("/?slack=error", request.url));
  }
}
