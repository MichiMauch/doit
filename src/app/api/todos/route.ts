import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TodoService } from "@/lib/db/service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") as "today" | "week" | "all" | null;
    
    const todos = await TodoService.getTodos(filter || "all", session.user.email);
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Prüfe auf API Key im Header (für externe Dienste wie ActivePieces)
    const apiKey = request.headers.get('x-api-key');
    const isAuthorizedMachine = apiKey === process.env.CRON_SECRET;

    // 2. Prüfe auf Session (für Menschen)
    const session = await getServerSession(authOptions);

    // 3. Bestimme die userEmail
    let userEmail: string | undefined;

    if (isAuthorizedMachine) {
      userEmail = process.env.CRON_USER_EMAIL;
    } else if (session?.user?.email) {
      userEmail = session.user.email;
    }

    // 4. Wenn weder noch -> Fehler
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validiere required fields
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Füge userEmail automatisch hinzu
    const todoData = {
      ...body,
      userEmail: userEmail
    };

    const todo = await TodoService.createTodo(todoData);
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
