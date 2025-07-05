"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import {
  Brain,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { type Todo } from "@/lib/db/schema";
import { type CalendarEvent } from "@/lib/google-calendar";
import { type AIAnalysisResult } from "@/lib/openai";

interface WeeklySummaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklySummary({ isOpen, onClose }: WeeklySummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    totalEstimatedHours: number;
    availableWorkingHours: number;
    isAIEnabled: boolean;
  } | null>(null);

  const currentWeek = {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Montag
    end: endOfWeek(new Date(), { weekStartsOn: 1 }), // Sonntag
  };

  // Filtere Todos für aktuelle Woche
  const weekTodos = allTodos.filter((todo) => {
    if (todo.completed) return false;
    if (!todo.dueDate) return true; // Todos ohne Deadline gehören zur aktuellen Woche

    const dueDate = new Date(todo.dueDate);
    return dueDate >= currentWeek.start && dueDate <= currentWeek.end;
  });

  const analyzeWorkload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Lade zuerst alle Todos
      const response = await fetch("/api/todos?filter=all");
      if (!response.ok) throw new Error("Failed to fetch todos");
      const allTodosData = await response.json();
      setAllTodos(allTodosData);

      // Führe KI-Analyse durch
      const aiResponse = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ todos: allTodosData }),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to analyze workload");
      }

      const aiResult = await aiResponse.json();

      setAnalysis({
        status: aiResult.status,
        workloadPercentage: aiResult.workloadPercentage,
        recommendations: aiResult.recommendations,
        priorities: aiResult.priorities,
        reschedulesSuggestions: aiResult.reschedulesSuggestions || [],
        risksIdentified: aiResult.risksIdentified,
      });

      setWeekEvents([]); // Events werden von der API-Route geladen
      setMetadata({
        totalEstimatedHours: aiResult.metadata?.totalEstimatedHours || 0,
        availableWorkingHours: aiResult.metadata?.availableWorkingHours || 0,
        isAIEnabled: aiResult.metadata?.isAIEnabled || false,
      });
    } catch (err) {
      console.error("Fehler bei Workload-Analyse:", err);
      setError("Fehler beim Laden der KI-Analyse. Versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      analyzeWorkload();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusColor = (status: AIAnalysisResult["status"]) => {
    switch (status) {
      case "optimal":
        return "text-green-600 bg-green-50 border-green-200";
      case "busy":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "overloaded":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const getStatusIcon = (status: AIAnalysisResult["status"]) => {
    switch (status) {
      case "optimal":
        return <CheckCircle className="h-5 w-5" />;
      case "busy":
        return <Clock className="h-5 w-5" />;
      case "overloaded":
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Wöchentliche Zusammenfassung</CardTitle>
                <CardDescription>
                  KI-Analyse für{" "}
                  {format(currentWeek.start, "d. MMM", { locale: de })} -{" "}
                  {format(currentWeek.end, "d. MMM yyyy", { locale: de })}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeWorkload}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Aktualisieren
              </Button>
              <Button variant="outline" onClick={onClose}>
                Schließen
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Analysiere Workload...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && !isLoading && (
            <>
              {/* Status Übersicht */}
              <Card className={`border-2 ${getStatusColor(analysis.status)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(analysis.status)}
                    <div>
                      <h3 className="font-semibold">
                        {analysis.status === "optimal" && "Optimale Auslastung"}
                        {analysis.status === "busy" && "Hohe Auslastung"}
                        {analysis.status === "overloaded" && "Überlastung"}
                      </h3>
                      <p className="text-sm opacity-80">
                        {Math.round(analysis.workloadPercentage)}% Ihrer
                        verfügbaren Arbeitszeit
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Geschätzte Arbeitszeit</div>
                      <div className="text-lg font-bold">
                        {metadata?.totalEstimatedHours || 0}h
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Verfügbare Zeit</div>
                      <div className="text-lg font-bold">
                        {Math.round(metadata?.availableWorkingHours || 0)}h
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Auslastung</div>
                      <div className="text-lg font-bold">
                        {Math.round(analysis.workloadPercentage)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aufgaben Übersicht */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Offene Aufgaben dieser Woche ({weekTodos.length})
                </h3>
                <div className="space-y-2">
                  {weekTodos.slice(0, 5).map((todo: Todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{todo.title}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          {todo.dueDate && (
                            <span>
                              📅 {format(new Date(todo.dueDate), "dd.MM.yyyy")}
                            </span>
                          )}
                          <span>⏱️ {todo.estimatedHours || 2}h</span>
                          <Badge
                            variant={
                              todo.priority === "high"
                                ? "destructive"
                                : todo.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {todo.priority === "high"
                              ? "Hoch"
                              : todo.priority === "medium"
                              ? "Mittel"
                              : "Niedrig"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {weekTodos.length > 5 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      ... und {weekTodos.length - 5} weitere Aufgaben
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* KI Empfehlungen */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  KI-Empfehlungen
                  {metadata?.isAIEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      ChatGPT aktiviert
                    </Badge>
                  )}
                </h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prioritäten */}
              {analysis.priorities && analysis.priorities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Prioritäten für diese Woche
                  </h3>
                  <div className="space-y-2">
                    {analysis.priorities.map((priority, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Umplanungsvorschläge */}
              {analysis.reschedulesSuggestions &&
                analysis.reschedulesSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      Umplanungsvorschläge
                    </h3>
                    <div className="space-y-2">
                      {analysis.reschedulesSuggestions.map(
                        (suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
                          >
                            <ArrowRight className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Risiken */}
              {analysis.risksIdentified &&
                analysis.risksIdentified.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Identifizierte Risiken
                    </h3>
                    <div className="space-y-2">
                      {analysis.risksIdentified.map((risk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Kalendertermine */}
              {weekEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Bestehende Termine ({weekEvents.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {weekEvents.slice(0, 10).map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 text-sm bg-gray-50 rounded"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {event.start && (
                            <div className="text-gray-600">
                              {format(new Date(event.start), "dd.MM. HH:mm")} -
                              {event.end &&
                                format(new Date(event.end), "HH:mm")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
