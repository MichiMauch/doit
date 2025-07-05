import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";

export async function POST() {
  try {
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ message: "Database initialized successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to initialize database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in database initialization endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
