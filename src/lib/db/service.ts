import { db } from "./index";
import { todos, tags, type Todo, type NewTodo, type Tag, type NewTag } from "./schema";
import { eq, desc, and, or, isNull, gte, lte, inArray } from "drizzle-orm";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export class TodoService {
  // Todo CRUD Operations
  static async createTodo(todo: Omit<NewTodo, "id" | "createdAt" | "updatedAt">): Promise<Todo> {
    // Konvertiere dueDate zu Date-Objekt falls nötig
    let dueDate = null;
    if (todo.dueDate) {
      if (typeof todo.dueDate === 'string') {
        dueDate = new Date(todo.dueDate);
      } else if (todo.dueDate instanceof Date) {
        dueDate = todo.dueDate;
      } else {
        // Falls es ein Timestamp ist
        dueDate = new Date(todo.dueDate);
      }
      
      // Prüfe ob das Datum gültig ist
      if (isNaN(dueDate.getTime())) {
        dueDate = null;
      }
    }

    const processedTodo = {
      ...todo,
      dueDate,
    };

    const result = await db.insert(todos).values({
      ...processedTodo,
      tags: processedTodo.tags, // Tags sind bereits als JSON-String formatiert
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return this.parseTodo(result[0]);
  }

  static async getTodos(filter?: "today" | "week" | "all", userEmail?: string, statusFilter?: ("todo" | "in_progress" | "done")[]): Promise<Todo[]> {
    const whereConditions = [];

    // User filter (if provided)
    if (userEmail) {
      whereConditions.push(eq(todos.userEmail, userEmail));
    }

    // Status filter (e.g. ["todo", "in_progress"])
    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(inArray(todos.status, statusFilter));
    }

    // Date filter
    if (filter === "today") {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);

      whereConditions.push(
        or(
          and(gte(todos.dueDate, start), lte(todos.dueDate, end)),
          isNull(todos.dueDate)
        )
      );
    } else if (filter === "week") {
      const today = new Date();
      const start = startOfWeek(today);
      const end = endOfWeek(today);

      whereConditions.push(
        or(
          and(gte(todos.dueDate, start), lte(todos.dueDate, end)),
          isNull(todos.dueDate)
        )
      );
    }
    
    const whereCondition = whereConditions.length > 0 
      ? whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions)
      : undefined;
    
    const query = whereCondition 
      ? db.select().from(todos).where(whereCondition).orderBy(desc(todos.createdAt))
      : db.select().from(todos).orderBy(desc(todos.createdAt));
    
    const result = await query;
    return result.map(this.parseTodo);
  }

  static async getTodoByEmailSource(emailSource: string, userEmail?: string): Promise<Todo | null> {
    const whereConditions = [eq(todos.emailSource, emailSource)];
    if (userEmail) {
      whereConditions.push(eq(todos.userEmail, userEmail));
    }
    const result = await db.select().from(todos)
      .where(and(...whereConditions))
      .limit(1);
    return result.length > 0 ? this.parseTodo(result[0]) : null;
  }

  static async getTodo(id: number): Promise<Todo | null> {
    const result = await db.select().from(todos).where(eq(todos.id, id)).limit(1);
    return result.length > 0 ? this.parseTodo(result[0]) : null;
  }

  static async updateTodo(id: number, todo: Partial<Omit<NewTodo, "id" | "createdAt">>): Promise<Todo | null> {
    // Konvertiere dueDate zu Date-Objekt falls nötig
    let dueDate = undefined;
    if (todo.dueDate !== undefined) {
      if (todo.dueDate === null) {
        dueDate = null;
      } else if (typeof todo.dueDate === 'string') {
        const parsedDate = new Date(todo.dueDate);
        dueDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else if (todo.dueDate instanceof Date) {
        dueDate = isNaN(todo.dueDate.getTime()) ? null : todo.dueDate;
      } else {
        // Falls es ein Timestamp ist
        const parsedDate = new Date(todo.dueDate);
        dueDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
      }
    }

    const processedTodo = {
      ...todo,
      dueDate,
    };

    const updateData = {
      ...processedTodo,
      tags: processedTodo.tags, // Tags sind bereits als JSON-String formatiert
      updatedAt: new Date(),
    };

    const result = await db.update(todos)
      .set(updateData)
      .where(eq(todos.id, id))
      .returning();
    
    return result.length > 0 ? this.parseTodo(result[0]) : null;
  }

  static async toggleTodo(id: number): Promise<Todo | null> {
    const todo = await this.getTodo(id);
    if (!todo) return null;
    
    return this.updateTodo(id, { completed: !todo.completed });
  }

  static async deleteTodo(id: number): Promise<boolean> {
    const result = await db.delete(todos).where(eq(todos.id, id)).returning();
    return result.length > 0;
  }

  // Tag Operations
  static async createTag(tag: Omit<NewTag, "id" | "createdAt">): Promise<Tag> {
    const result = await db.insert(tags).values({
      ...tag,
      createdAt: new Date(),
    }).returning();
    
    return result[0];
  }

  static async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  static async deleteTag(id: number): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }

  // Helper Methods
  private static parseTodo(todo: Todo & { tags?: string | null }): Todo {
    return {
      ...todo,
      tags: todo.tags ? JSON.parse(todo.tags) : null,
    };
  }

  static async getStats(userEmail?: string) {
    try {
      console.log("📊 Getting todos for stats...", userEmail ? `for user: ${userEmail}` : "all users");
      const allTodos = await this.getTodos("all", userEmail);
      console.log("📊 All todos count:", allTodos.length);
      
      const todayTodos = await this.getTodos("today", userEmail);
      console.log("📊 Today todos count:", todayTodos.length);
      
      // Berechne verspätet abgeschlossene Tasks
      const completedLate = allTodos.filter(t => {
        if (!t.completed || !t.dueDate || !t.updatedAt) return false;
        
        const dueDate = new Date(t.dueDate);
        const completedDate = new Date(t.updatedAt);
        
        // Nur das Datum vergleichen, nicht die Uhrzeit (falls nur Datum gesetzt wurde)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const completedDateOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
        
        return completedDateOnly > dueDateOnly;
      }).length;

      const stats = {
        total: allTodos.length,
        completed: allTodos.filter(t => t.completed).length,
        pending: allTodos.filter(t => !t.completed).length,
        completedLate: completedLate,
        todayTotal: todayTodos.length,
        todayCompleted: todayTodos.filter(t => t.completed).length,
      };
      
      console.log("📊 Calculated stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error in getStats:", error);
      throw error;
    }
  }
}
