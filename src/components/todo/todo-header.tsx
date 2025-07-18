"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  Brain,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TodoHeaderProps {
  currentFilter: "today" | "week" | "all";
  onFilterChange: (filter: "today" | "week" | "all") => void;
  onNewTodo: () => void;
  onShowSummary: () => void;
  onShowStatistics: () => void;
  onSmartSuggestions: () => void;
  stats?: {
    total: number;
    completed: number;
    pending: number;
    todayTotal: number;
    todayCompleted: number;
  };
}

export function TodoHeader({
  currentFilter,
  onFilterChange,
  onNewTodo,
  onShowSummary,
  onShowStatistics,
  onSmartSuggestions,
  stats,
}: TodoHeaderProps) {
  const today = new Date();
  const dateText = format(today, "EEEE, d. MMMM yyyy", { locale: de });

  const filterOptions = [
    { key: "today" as const, label: "Heute", icon: Calendar },
    { key: "week" as const, label: "Woche", icon: Clock },
    { key: "all" as const, label: "Alle", icon: Filter },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Datum und App-Titel */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/doit-logo.png" alt="DOIT" className="h-16 w-auto" />
              <div className="flex items-center gap-2">
                <a
                  href="/design-system"
                  className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors"
                >
                  Design System
                </a>
                <a
                  href="/version"
                  className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors"
                >
                  Version
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {dateText}
            </p>
          </div>

          {/* Mobile Header Buttons */}
          <div className="flex md:hidden items-center">
            <ThemeToggle />
          </div>

          {/* Desktop Buttons Gruppe */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={onSmartSuggestions}
              className="border-primary-300 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 shadow-sm"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Smart Suggestions
            </Button>
            <Button
              variant="outline"
              onClick={onShowSummary}
              className="border-primary-300 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 shadow-sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Zusammenfassung
            </Button>
            <Button
              variant="outline"
              onClick={onShowStatistics}
              className="border-primary-300 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 shadow-sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiken
            </Button>
            <Button
              onClick={onNewTodo}
              className="bg-primary-400 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-lg"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Aufgabe
            </Button>
          </div>
        </div>

        {/* Filter und Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {filterOptions.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={currentFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(key)}
                className={`flex items-center gap-2 ${
                  currentFilter === key
                    ? "bg-primary-400 hover:bg-primary-500 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Stats Badges */}
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-primary-100 text-primary-800 flex items-center gap-1">
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                Heute: {stats.todayCompleted}/{stats.todayTotal}
              </Badge>
              <Badge className="bg-success-100 text-success-800 flex items-center gap-1">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                Gesamt: {stats.completed}/{stats.total}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
