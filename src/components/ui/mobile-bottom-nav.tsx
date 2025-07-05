"use client";

import { Plus, Brain, BarChart3, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onNewTodo: () => void;
  onShowSummary: () => void;
  onShowStatistics: () => void;
  onSmartSuggestions: () => void;
}

export function MobileBottomNav({
  onNewTodo,
  onShowSummary,
  onShowStatistics,
  onSmartSuggestions,
}: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-16 px-2">
        {/* Smart Suggestions Button */}
        <Button
          variant="ghost"
          onClick={onSmartSuggestions}
          className={cn(
            "h-full rounded-xl mx-1 flex flex-col items-center justify-center gap-1",
            "text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all duration-200"
          )}
        >
          <Lightbulb className="h-5 w-5" />
          <span className="text-xs font-medium">Smart</span>
        </Button>

        {/* Zusammenfassung Button */}
        <Button
          variant="ghost"
          onClick={onShowSummary}
          className={cn(
            "h-full rounded-xl mx-1 flex flex-col items-center justify-center gap-1",
            "text-gray-600 hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-200"
          )}
        >
          <Brain className="h-5 w-5" />
          <span className="text-xs font-medium">KI</span>
        </Button>

        {/* Neue Aufgabe Button (hervorgehoben) */}
        <Button
          onClick={onNewTodo}
          className={cn(
            "h-12 w-12 rounded-full mx-auto mt-2 shadow-lg",
            "bg-primary-400 hover:bg-primary-500 text-white",
            "flex items-center justify-center transition-all duration-200 hover:scale-105"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Statistiken Button */}
        <Button
          variant="ghost"
          onClick={onShowStatistics}
          className={cn(
            "h-full rounded-xl mx-1 flex flex-col items-center justify-center gap-1",
            "text-gray-600 hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-200"
          )}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-medium">Stats</span>
        </Button>
      </div>
    </div>
  );
}
