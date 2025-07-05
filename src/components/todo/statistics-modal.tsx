"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  subDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  Flame,
} from "lucide-react";
import { type Todo } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WeekStats {
  completed: number;
  total: number;
  completionRate: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

interface ProductivityStats {
  currentWeek: WeekStats;
  lastWeek: WeekStats;
  totalCompleted: number;
  totalTasks: number;
  overallCompletionRate: number;
  currentStreak: number;
  longestStreak: number;
  averageTasksPerDay: number;
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

const calculateWeekStats = (todos: Todo[]): WeekStats => {
  const completed = todos.filter((todo) => todo.completed).length;
  const total = todos.length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    completed,
    total,
    completionRate,
    highPriority: todos.filter((todo) => todo.priority === "high").length,
    mediumPriority: todos.filter((todo) => todo.priority === "medium").length,
    lowPriority: todos.filter((todo) => todo.priority === "low").length,
  };
};

const calculateStreaks = (
  todos: Todo[]
): { currentStreak: number; longestStreak: number } => {
  const completedTodos = todos.filter((todo) => todo.completed && todo.updatedAt);
  
  if (completedTodos.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Gruppiere erledigte Todos nach Tagen
  const dayGroups = new Map<string, number>();
  
  completedTodos.forEach(todo => {
    const dayKey = startOfDay(new Date(todo.updatedAt)).toISOString().split('T')[0];
    dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1);
  });

  // Sortiere Tage chronologisch
  const sortedDays = Array.from(dayGroups.keys()).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = startOfDay(new Date()).toISOString().split('T')[0];
  const yesterday = startOfDay(subDays(new Date(), 1)).toISOString().split('T')[0];

  // Berechne Streaks
  for (let i = 0; i < sortedDays.length; i++) {
    const currentDay = sortedDays[i];
    const prevDay = i > 0 ? sortedDays[i - 1] : null;
    
    if (prevDay) {
      const daysDiff = Math.abs(
        (new Date(currentDay).getTime() - new Date(prevDay).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Berechne aktuellen Streak (muss bis heute oder gestern gehen)
  const lastDay = sortedDays[sortedDays.length - 1];
  if (lastDay === today || lastDay === yesterday) {
    // Zähle rückwärts von heute/gestern
    currentStreak = 1;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const daysDiff = Math.abs(
        (new Date(sortedDays[i + 1]).getTime() - new Date(sortedDays[i]).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};

export function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateStatistics = useCallback(
    (todos: Todo[]): ProductivityStats => {
      // Fallback für leere oder ungültige Daten
      if (!todos || !Array.isArray(todos) || todos.length === 0) {
        return {
          currentWeek: {
            completed: 0,
            total: 0,
            completionRate: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0,
          },
          lastWeek: {
            completed: 0,
            total: 0,
            completionRate: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0,
          },
          totalCompleted: 0,
          totalTasks: 0,
          overallCompletionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageTasksPerDay: 0,
          priorityDistribution: { high: 0, medium: 0, low: 0 },
        };
      }

      const now = new Date();
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      // Filtere Aufgaben nach Wochen (basierend auf wann sie erledigt wurden)
      const currentWeekTodos = todos.filter((todo) => {
        if (!todo.completed) return false;
        const completedAt = new Date(todo.updatedAt);
        return (
          isAfter(completedAt, currentWeekStart) &&
          isBefore(completedAt, currentWeekEnd)
        );
      });

      const lastWeekTodos = todos.filter((todo) => {
        if (!todo.completed) return false;
        const completedAt = new Date(todo.updatedAt);
        return (
          isAfter(completedAt, lastWeekStart) && isBefore(completedAt, lastWeekEnd)
        );
      });

      // Berechne Wochen-Statistiken
      const currentWeek = calculateWeekStats(currentWeekTodos);
      const lastWeek = calculateWeekStats(lastWeekTodos);

      // Gesamtstatistiken
      const completedTodos = todos.filter((todo) => todo.completed);
      const totalCompleted = completedTodos.length;
      const totalTasks = todos.length;
      const overallCompletionRate =
        totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

      // Berechne Streaks
      const { currentStreak, longestStreak } = calculateStreaks(todos);

      // Durchschnittliche Aufgaben pro Tag (basierend auf erledigten Aufgaben)
      // Finde das älteste und neueste Datum für korrekte Berechnung
      const allDates = todos
        .filter(todo => todo.completed)
        .map(todo => new Date(todo.updatedAt))
        .sort((a, b) => a.getTime() - b.getTime());
      
      const daysWithData = Math.max(
        1,
        allDates.length > 0 
          ? Math.ceil((now.getTime() - allDates[0].getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 1
      );
      const averageTasksPerDay = totalCompleted / daysWithData;

      // Prioritätsverteilung (nur erledigte Aufgaben)
      const completedTodos = todos.filter(todo => todo.completed);
      const priorityDistribution = {
        high: completedTodos.filter((todo) => todo.priority === "high").length,
        medium: completedTodos.filter((todo) => todo.priority === "medium").length,
        low: completedTodos.filter((todo) => todo.priority === "low").length,
      };

      return {
        currentWeek,
        lastWeek,
        totalCompleted,
        totalTasks,
        overallCompletionRate,
        currentStreak,
        longestStreak,
        averageTasksPerDay,
        priorityDistribution,
      };
    },
    []
  );

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      // Lade alle Todos statt der Stats
      const response = await fetch("/api/todos?filter=all");
      if (response.ok) {
        const todos: Todo[] = await response.json();
        console.log("Loaded todos for statistics:", todos);

        // Validiere dass todos ein Array ist
        if (Array.isArray(todos)) {
          const calculatedStats = calculateStatistics(todos);
          setStats(calculatedStats);
        } else {
          console.error(
            "Expected todos to be an array, but got:",
            typeof todos
          );
          setStats(null);
        }
      } else {
        console.error("Failed to fetch todos for statistics:", response.status);
        setStats(null);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [calculateStatistics]);

  useEffect(() => {
    if (isOpen) {
      fetchStatistics();
    }
  }, [isOpen, fetchStatistics]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous)
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-600";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Produktivitäts-Statistiken
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Wochen-Vergleich */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Diese Woche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {stats.currentWeek.completed}
                      </span>
                      <span className="text-sm text-gray-500">
                        von {stats.currentWeek.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${stats.currentWeek.completionRate}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.currentWeek.completionRate.toFixed(1)}% erledigt
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Vorwoche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {stats.lastWeek.completed}
                      </span>
                      <span className="text-sm text-gray-500">
                        von {stats.lastWeek.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full transition-all"
                        style={{ width: `${stats.lastWeek.completionRate}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.lastWeek.completionRate.toFixed(1)}% erledigt
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trend-Indikatoren */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Erledigte Aufgaben
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.currentWeek.completed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(
                        stats.currentWeek.completed,
                        stats.lastWeek.completed
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          getTrendColor(
                            stats.currentWeek.completed,
                            stats.lastWeek.completed
                          )
                        )}
                      >
                        {stats.currentWeek.completed -
                          stats.lastWeek.completed >
                        0
                          ? "+"
                          : ""}
                        {stats.currentWeek.completed - stats.lastWeek.completed}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Erfolgsrate
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.currentWeek.completionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(
                        stats.currentWeek.completionRate,
                        stats.lastWeek.completionRate
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          getTrendColor(
                            stats.currentWeek.completionRate,
                            stats.lastWeek.completionRate
                          )
                        )}
                      >
                        {stats.currentWeek.completionRate -
                          stats.lastWeek.completionRate >
                        0
                          ? "+"
                          : ""}
                        {(
                          stats.currentWeek.completionRate -
                          stats.lastWeek.completionRate
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Aktuelle Serie
                      </p>
                      <p className="text-2xl font-bold flex items-center gap-1">
                        <Flame className="h-6 w-6 text-orange-500" />
                        {stats.currentStreak}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Beste Serie</p>
                      <p className="text-sm font-medium">
                        {stats.longestStreak} Tage
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gesamtstatistiken */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Gesamtübersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalCompleted}
                    </p>
                    <p className="text-sm text-gray-600">Erledigt</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Circle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.totalTasks - stats.totalCompleted}
                    </p>
                    <p className="text-sm text-gray-600">Offen</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.overallCompletionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Erfolgsrate</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.averageTasksPerDay.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Ø pro Tag</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prioritäts-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prioritäts-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="destructive"
                      className="w-3 h-3 p-0"
                    ></Badge>
                    <span className="text-sm">
                      Hoch: {stats.priorityDistribution.high}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="w-3 h-3 p-0 bg-yellow-500"
                    ></Badge>
                    <span className="text-sm">
                      Mittel: {stats.priorityDistribution.medium}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="w-3 h-3 p-0 bg-green-500"
                    ></Badge>
                    <span className="text-sm">
                      Niedrig: {stats.priorityDistribution.low}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Daten verfügbar</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
