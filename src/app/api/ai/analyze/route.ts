import { NextRequest, NextResponse } from "next/server";
import { OpenAIService } from "@/lib/openai";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { type Todo } from "@/lib/db/schema";
import { startOfWeek, endOfWeek } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { todos }: { todos: Todo[] } = body;

    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json(
        { error: "Todos array is required" },
        { status: 400 }
      );
    }

    // Aktuelle Woche definieren
    const currentWeek = {
      start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Montag
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),     // Sonntag
    };

    // Lade Kalendertermine für die Woche
    const calendarEvents = await GoogleCalendarService.getEventsForDateRange(
      currentWeek.start,
      currentWeek.end
    );

    // Berechne verfügbare Arbeitszeit
    const workingDays = [1, 2, 3, 4]; // Mo-Do
    const dailyWorkingHours = (12 - 8.75) + (17 - 13.25); // 7h täglich
    const totalAvailableHours = workingDays.length * dailyWorkingHours;

    // Berechne geblockte Zeit durch Kalendertermine
    let blockedHours = 0;
    calendarEvents.forEach(event => {
      if (event.start && event.end) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const dayOfWeek = start.getDay();
        
        if (workingDays.includes(dayOfWeek)) {
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          blockedHours += duration;
        }
      }
    });

    const availableWorkingHours = totalAvailableHours - blockedHours;

    // Filtere Todos für diese Woche
    const weekTodos = todos.filter((todo: Todo) => {
      if (todo.completed) return false;
      if (!todo.dueDate) return true;
      
      const dueDate = new Date(todo.dueDate);
      return dueDate >= currentWeek.start && dueDate <= currentWeek.end;
    });

    // Berechne geschätzte Stunden
    const totalEstimatedHours = weekTodos.reduce((sum: number, todo: Todo) => {
      return sum + (todo.estimatedHours || 2);
    }, 0);

    // Führe KI-Analyse durch
    const analysis = await OpenAIService.analyzeWorkload({
      todos: weekTodos,
      calendarEvents,
      weekStart: currentWeek.start,
      weekEnd: currentWeek.end,
      availableWorkingHours,
      totalEstimatedHours,
    });

    return NextResponse.json({
      ...analysis,
      metadata: {
        weekStart: currentWeek.start.toISOString(),
        weekEnd: currentWeek.end.toISOString(),
        totalTodos: weekTodos.length,
        totalCalendarEvents: calendarEvents.length,
        availableWorkingHours,
        totalEstimatedHours,
        isAIEnabled: OpenAIService.isAvailable(),
      }
    });

  } catch (error) {
    console.error("Error in AI analysis:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze workload",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
