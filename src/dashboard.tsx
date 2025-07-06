"use client";

import { useState, useEffect, useCallback } from "react";
import { TodoHeader } from "@/components/todo/todo-header";
import { TodoList } from "@/components/todo/todo-list";
import { TodoForm } from "@/components/todo/todo-form";
import { CalendarView } from "@/components/calendar/calendar-view";
import { WeeklySummary } from "@/components/todo/weekly-summary";
import { StatisticsModal } from "@/components/todo/statistics-modal";
import { SmartSuggestionsBox } from "@/components/todo/smart-suggestions-box";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { type Todo, type NewTodo } from "@/lib/db/schema";

type FilterType = "today" | "week" | "all";

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isSmartSuggestionsOpen, setIsSmartSuggestionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    pending: number;
    todayTotal: number;
    todayCompleted: number;
  } | null>(null);

  // Lade Todos basierend auf dem aktuellen Filter
  const loadTodos = useCallback(
    async (currentFilter: FilterType = filter) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/todos?filter=${currentFilter}`);
        if (!response.ok) throw new Error("Failed to fetch todos");
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Error loading todos:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filter]
  );

  // Lade Statistiken
  const loadStats = useCallback(async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch("/api/todos/stats", {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Stats API error:", response.status, errorText);

          if (retryCount === maxRetries - 1) {
            throw new Error(`Failed to fetch stats: ${response.status}`);
          }

          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
          continue;
        }

        const data = await response.json();
        setStats(data);
        return; // Erfolgreich - beende die Schleife
      } catch (error) {
        console.error("Error loading stats:", error);

        if (retryCount === maxRetries - 1) {
          // Letzter Versuch fehlgeschlagen - setze Default-Stats
          setStats({
            total: 0,
            completed: 0,
            pending: 0,
            todayTotal: 0,
            todayCompleted: 0,
          });
        } else {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 Sekunde warten
        }
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      try {
        // Erst Todos laden, dann Stats
        await loadTodos();
        // Kurz warten um sicherzustellen dass die DB-Verbindung stabil ist
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadStats();
      } catch (error) {
        console.error("Error during initial load:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialLoad();
  }, [loadTodos, loadStats]);

  // Reload todos when filter changes
  useEffect(() => {
    loadTodos(filter);
  }, [filter, loadTodos]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const handleNewTodo = () => {
    setEditingTodo(null);
    setIsFormOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const handleSaveTodo = async (
    todoData: Omit<NewTodo, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setIsSaving(true);

      if (editingTodo) {
        // Update existing todo
        const updateResponse = await fetch(`/api/todos/${editingTodo.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(todoData),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update todo");
        }
      } else {
        // Create new todo
        const createResponse = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(todoData),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create todo");
        }
      }

      // Reload todos and stats
      await loadTodos();
      await loadStats();
      setIsFormOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error("Error saving todo:", error);
      // Show user-friendly error message
      alert("Fehler beim Speichern der Aufgabe. Bitte versuche es erneut.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle todo: ${response.status}`);
      }

      // Reload todos and stats
      await loadTodos();
      await loadStats();
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Möchtest du diese Aufgabe wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete todo");

      // Reload todos and stats
      await loadTodos();
      await loadStats();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  // Handler für Statuswechsel (optimistisch)
  const handleStatusChange = async (id: number, status: "todo" | "in_progress" | "done") => {
    
    // Optimistisches Update
    setTodos((prev) => {
      const updated = prev.map((todo) =>
        todo.id === id ? { 
          ...todo, 
          status,
          completed: status === "done"
        } : todo
      );
      return updated;
    });
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          completed: status === "done"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API request failed:", response.status, errorText);
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      await response.json();
      
      // Nach erfolgreichem Backend-Update: neu laden (zur Sicherheit)
      await loadTodos();
      await loadStats();
    } catch (error) {
      console.error("Error updating status:", error);
      // Im Fehlerfall: reload, damit der State wieder stimmt
      await loadTodos();
      await loadStats();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      {/* pb-16 für Mobile Bottom Nav */}
      <TodoHeader
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        onNewTodo={handleNewTodo}
        onShowSummary={() => setIsSummaryOpen(true)}
        onShowStatistics={() => setIsStatisticsOpen(true)}
        onSmartSuggestions={() => setIsSmartSuggestionsOpen(!isSmartSuggestionsOpen)}
        stats={stats || undefined}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Todo-Liste (2/3 der Breite auf großen Bildschirmen) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Smart Suggestions - nur anzeigen wenn geöffnet */}
            {isSmartSuggestionsOpen && (
              <SmartSuggestionsBox onCreateTodo={handleSaveTodo} />
            )}

            {/* Todo Liste */}
            <TodoList
              todos={todos}
              onToggle={handleToggleTodo}
              onEdit={handleEditTodo}
              onDelete={handleDeleteTodo}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Kalender-Sidebar (1/3 der Breite auf großen Bildschirmen) */}
          <div className="lg:col-span-1">
            <CalendarView />
          </div>
        </div>
      </main>

      <TodoForm
        todo={editingTodo}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTodo(null);
        }}
        onSave={handleSaveTodo}
        isSaving={isSaving}
      />

      <WeeklySummary
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />

      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onNewTodo={handleNewTodo}
        onShowSummary={() => setIsSummaryOpen(true)}
        onShowStatistics={() => setIsStatisticsOpen(true)}
        onSmartSuggestions={() => setIsSmartSuggestionsOpen(!isSmartSuggestionsOpen)}
      />
    </div>
  );
}
