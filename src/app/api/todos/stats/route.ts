import { NextResponse } from "next/server";
import { TodoService } from "@/lib/db/service";

export async function GET() {
  try {
    console.log("📊 Loading stats...");
    const stats = await TodoService.getStats();
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
