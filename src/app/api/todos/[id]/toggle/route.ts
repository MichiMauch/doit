import { NextRequest, NextResponse } from "next/server";
import { TodoService } from "@/lib/db/service";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const todoId = parseInt(id);
    
    console.log("🔄 API: Toggling todo ID:", todoId);
    
    // Get current todo first for logging
    const currentTodo = await TodoService.getTodo(todoId);
    console.log("📋 Current todo before toggle:", {
      id: currentTodo?.id,
      title: currentTodo?.title,
      completed: currentTodo?.completed
    });
    
    const todo = await TodoService.toggleTodo(todoId);
    
    if (!todo) {
      console.error("❌ Todo not found:", todoId);
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }
    
    console.log("✅ Todo toggled successfully:", {
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      updatedAt: todo.updatedAt
    });
    
    return NextResponse.json(todo);
  } catch (error) {
    console.error("❌ Error toggling todo:", error);
    return NextResponse.json(
      { error: "Failed to toggle todo" },
      { status: 500 }
    );
  }
}