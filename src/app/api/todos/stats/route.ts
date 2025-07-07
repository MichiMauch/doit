import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TodoService } from "@/lib/db/service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📊 Loading stats for user:", session.user.email);
    const stats = await TodoService.getStats(session.user.email);
    console.log("📊 Stats loaded successfully:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to fetch stats", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
