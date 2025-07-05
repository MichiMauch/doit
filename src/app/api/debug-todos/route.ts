import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";

export async function GET() {
  try {
    // Hole ALLE Todos direkt aus der Datenbank
    const allTodos = await db.select().from(todos);
    
    console.log("🔍 Debug Todos - Direct DB Query:");
    console.log("Total todos in DB:", allTodos.length);
    
    allTodos.forEach((todo, index) => {
      console.log(`DB Todo ${index + 1}:`, {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        createdAt: todo.createdAt?.toISOString(),
        updatedAt: todo.updatedAt?.toISOString()
      });
    });
    
    const completedCount = allTodos.filter(t => t.completed).length;
    const pendingCount = allTodos.filter(t => !t.completed).length;
    
    return NextResponse.json({
      total: allTodos.length,
      completed: completedCount,
      pending: pendingCount,
      todos: allTodos.map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        createdAt: todo.createdAt?.toISOString(),
        updatedAt: todo.updatedAt?.toISOString(),
        dueDate: todo.dueDate?.toISOString(),
        priority: todo.priority
      }))
    });
  } catch (error) {
    console.error("Debug todos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug todos" },
      { status: 500 }
    );
  }
}