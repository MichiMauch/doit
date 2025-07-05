"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Calendar,
  Clock,
  CheckCircle,
  X,
  RefreshCw,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type TodoSuggestion } from "@/lib/smart-suggestions";
import { type NewTodo } from "@/lib/db/schema";

interface SmartSuggestionsBoxProps {
  onCreateTodo: (
    todoData: Omit<NewTodo, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  className?: string;
}

interface SmartSuggestionsResponse {
  success: boolean;
  suggestions: TodoSuggestion[];
  count: number;
  error?: string;
  warning?: string;
}

export function SmartSuggestionsBox({
  onCreateTodo,
  className,
}: SmartSuggestionsBoxProps) {
  const [suggestions, setSuggestions] = useState<TodoSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingTodos, setCreatingTodos] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set()
  );

  // Hilfsfunktion zum Laden der Calendar Events für einen Datumsbereich
  const loadCalendarEventsForDateRange = async (futureDays: number) => {
    const events = [];
    const today = new Date();

    for (let i = 0; i <= futureDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

      try {
        const response = await fetch(`/api/calendar/events?date=${dateString}`);
        if (response.ok) {
          const data = await response.json();
          if (data.events && Array.isArray(data.events)) {
            events.push(...data.events);
          }
        }
      } catch (error) {
        console.warn(
          `⚠️ Fehler beim Laden von Events für ${dateString}:`,
          error
        );
      }
    }

    return events;
  };

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Erst Calendar Events für die nächsten 4 Tage laden
      const events = await loadCalendarEventsForDateRange(4);

      if (events.length === 0) {
        console.log(
          "📅 Keine Calendar Events gefunden - keine Smart Suggestions möglich"
        );
        setSuggestions([]);
        return;
      }

      // 2. Events an Smart Suggestions API senden
      const response = await fetch("/api/smart-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: events,
          futureDays: 4,
        }),
      });

      const data: SmartSuggestionsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load suggestions");
      }

      setSuggestions(data.suggestions);
      console.log(`🧠 ${data.count} Smart Suggestions geladen`);

      // Zeige Warnung wenn vorhanden
      if (data.warning) {
        console.warn("⚠️ Smart Suggestions Warnung:", data.warning);
      }
    } catch (err) {
      console.error("❌ Fehler beim Laden der Smart Suggestions:", err);
      setError("Fehler beim Laden der Vorschläge");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTodo = async (
    suggestion: TodoSuggestion,
    todoText: string
  ) => {
    const suggestionKey = `${suggestion.id}_${todoText}`;
    setCreatingTodos((prev) => new Set(prev).add(suggestionKey));

    try {
      await onCreateTodo({
        title: todoText,
        description: `Automatisch vorgeschlagen basierend auf: "${suggestion.eventTitle}"\\n\\n${suggestion.reasoning}`,
        priority: suggestion.priority,
        estimatedHours: suggestion.estimatedHours,
        completed: false,
        dueDate: null,
        tags: JSON.stringify(["smart-suggestion"]),
      });

      // Erfolg - markiere Vorschlag als verwendet
      setDismissedSuggestions((prev) => new Set(prev).add(suggestion.id));
    } catch (error) {
      console.error("❌ Fehler beim Erstellen der Aufgabe:", error);
    } finally {
      setCreatingTodos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestionKey);
        return newSet;
      });
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(suggestionId));
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getPriorityLabel = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "Hoch";
      case "medium":
        return "Mittel";
      case "low":
        return "Niedrig";
    }
  };

  // Filtere ausgeblendete Vorschläge
  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s.id)
  );

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            </div>
            <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
          </div>
          <CardDescription className="flex items-center gap-2">
            <span>Analysiere deine Kalender-Termine...</span>
            <span className="inline-flex">
              <span className="animate-pulse">🧠</span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading Suggestion Cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/50"
            >
              {/* Event Header */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full bg-purple-200" />
                <Skeleton className="h-4 w-32 bg-purple-200" />
                <Skeleton className="h-6 w-16 rounded-full bg-blue-200" />
              </div>
              
              {/* Event Title */}
              <Skeleton className="h-5 w-3/4 bg-gray-300" />
              
              {/* Suggested Todos */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-green-200" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full bg-gray-200" />
                  <Skeleton className="h-3 w-5/6 bg-gray-200" />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded bg-green-200" />
                <Skeleton className="h-8 w-8 rounded bg-gray-200" />
              </div>
            </div>
          ))}
          
          {/* Loading Progress Indicator */}
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Erstelle intelligente Vorschläge...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Smart Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSuggestions}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSuggestions}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Keine neuen Vorschläge verfügbar.
              <br />
              Prüfe später wieder oder führe einige Meetings durch!
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              Tipp: Stelle sicher, dass Google Calendar verbunden ist.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {visibleSuggestions.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        <CardDescription>
          Intelligente Aufgaben-Vorschläge aus deinen Kalender-Terminen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/50"
          >
            {/* Event Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(suggestion.eventDate, "EEEE, d. MMMM", {
                      locale: de,
                    })}
                  </span>
                  {suggestion.estimatedHours && (
                    <>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{suggestion.estimatedHours}h geschätzt</span>
                    </>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {suggestion.eventTitle}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getPriorityColor(suggestion.priority)
                    )}
                  >
                    {getPriorityLabel(suggestion.priority)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissSuggestion(suggestion.id)}
                className="text-muted-foreground hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Reasoning */}
            <p className="text-sm text-muted-foreground italic">
              {suggestion.reasoning}
            </p>

            {/* Suggested Tasks */}
            <div className="space-y-2">
              {suggestion.suggestions.map((task, index) => {
                const suggestionKey = `${suggestion.id}_${task}`;
                const isCreating = creatingTodos.has(suggestionKey);

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white/80 rounded-md border border-purple-100"
                  >
                    <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {task}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateTodo(suggestion, task)}
                      disabled={isCreating}
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 flex-shrink-0"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Erstelle...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Erstellen
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
