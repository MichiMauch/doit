import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST() {
  try {
    console.log("🔧 Adding estimatedHours column to todos table...");
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Prüfe ob die Spalte bereits existiert
    try {
      await client.execute("SELECT estimated_hours FROM todos LIMIT 1");
      console.log("✅ Column estimated_hours already exists");
      return NextResponse.json({ message: "Column already exists" });
    } catch {
      console.log("📝 Column estimated_hours does not exist, adding it...");
    }

    // Füge die neue Spalte hinzu
    await client.execute("ALTER TABLE todos ADD COLUMN estimated_hours INTEGER");
    
    console.log("✅ Successfully added estimated_hours column");
    return NextResponse.json({ message: "Migration completed successfully" });
  } catch (error) {
    console.error("❌ Error during migration:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
