"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  Clock,
  Calendar,
  Mail,
  Tag as TagIcon,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  Timer,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CelebrationAnimation } from "@/components/ui/celebration-animation";
import { type Todo } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (
    id: number,
    status: "todo" | "in_progress" | "done"
  ) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
  dragHandleProps,
}: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleToggle = () => {
    // Wenn die Aufgabe als erledigt markiert wird, zeige Celebration
    if (!todo.completed) {
      setShowCelebration(true);
    }
    onToggle(todo.id);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-gradient-to-r from-danger-200/30 to-white";
      case "medium":
        return "bg-gradient-to-r from-warning-200/30 to-white";
      case "low":
        return "bg-gradient-to-r from-success-200/30 to-white";
      default:
        return "bg-gradient-to-r from-gray-200/30 to-white";
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-danger-500";
      case "medium":
        return "border-l-warning-500";
      case "low":
        return "border-l-success-500";
      default:
        return "border-l-gray-500";
    }
  };

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const isToday = due.toDateString() === now.toDateString();
    const isTomorrow =
      due.toDateString() ===
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    const isPast = due < now;
    
    // Prüfe ob es sich um "nur Datum" handelt (00:00:00)
    const isDateOnly = due.getHours() === 0 && due.getMinutes() === 0 && due.getSeconds() === 0;

    if (isToday) {
      return {
        text: isDateOnly ? "Heute" : `Heute, ${format(due, "HH:mm")}`,
        className: "text-primary-700 bg-primary-50",
      };
    } else if (isTomorrow) {
      return {
        text: isDateOnly ? "Morgen" : `Morgen, ${format(due, "HH:mm")}`,
        className: "text-success-700 bg-success-50",
      };
    } else if (isPast) {
      return {
        text: isDateOnly 
          ? format(due, "dd.MM.yyyy", { locale: de })
          : format(due, "dd.MM.yyyy, HH:mm", { locale: de }),
        className: "text-danger-700 bg-danger-50",
      };
    } else {
      return {
        text: isDateOnly 
          ? format(due, "dd.MM.yyyy", { locale: de })
          : format(due, "dd.MM.yyyy, HH:mm", { locale: de }),
        className: "text-gray-600 bg-gray-50",
      };
    }
  };

  const dueInfo = formatDueDate(todo.dueDate);
  const tags = todo.tags
    ? Array.isArray(todo.tags)
      ? todo.tags
      : JSON.parse(todo.tags as string)
    : [];

  // Status-Label und Farbe
  const statusLabel =
    todo.status === "in_progress"
      ? "In Bearbeitung"
      : todo.status === "done" || todo.completed
      ? "Erledigt"
      : "Zu erledigen";
  const statusColor =
    todo.status === "in_progress"
      ? "bg-warning-100 text-warning-800"
      : todo.status === "done" || todo.completed
      ? "bg-success-100 text-success-800"
      : "bg-gray-100 text-gray-800";

  // Status-Wechsel-Handler
  const handleStatusChange = (newStatus: "todo" | "in_progress" | "done") => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus);
    }
  };

  return (
    <div
      className={cn(
        "group border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
        todo.completed
          ? "bg-gray-50 opacity-75"
          : getPriorityGradient(todo.priority || "medium"),
        "border-l-4",
        todo.completed
          ? "border-l-success-500"
          : getPriorityBorderColor(todo.priority || "medium")
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            className="mt-0.5 cursor-pointer"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-medium text-sm sm:text-base leading-tight",
                  todo.completed && "line-through text-gray-500"
                )}
              >
                {todo.title}
              </h3>

              {/* Status-Badge */}
              <span
                className={`inline-block text-xs font-semibold px-2 py-1 rounded ${statusColor} mr-2 mt-1`}
              >
                {statusLabel}
              </span>

              {/* Datum direkt unter dem Titel - prominent angezeigt */}
              {dueInfo && (
                <div
                  className={cn(
                    "mt-1 text-xs font-medium px-2 py-1 rounded-md inline-block",
                    dueInfo.className
                  )}
                >
                  <Clock className="h-3 w-3 inline mr-1" />
                  {dueInfo.text}
                </div>
              )}
            </div>

            {/* Actions Menu and Drag Handle */}
            <div className="flex items-center gap-1">
              {/* Drag Handle */}
              {dragHandleProps && (
                <div
                  {...dragHandleProps}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              )}
              
              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(todo)}>
                  <Edit3 className="h-4 w-4 mr-2" /> Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(todo.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Löschen
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Timer className="h-4 w-4 mr-2" /> Status ändern:
                </DropdownMenuItem>
                {todo.status !== "todo" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                    Zu erledigen
                  </DropdownMenuItem>
                )}
                {todo.status !== "in_progress" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("in_progress")}
                  >
                    In Bearbeitung
                  </DropdownMenuItem>
                )}
                {todo.status !== "done" && !todo.completed && (
                  <DropdownMenuItem onClick={() => handleStatusChange("done")}>
                    Erledigt
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Zeitestimation */}
            {todo.estimatedHours && (
              <Badge variant="outline" className="text-xs">
                <Timer className="h-3 w-3 mr-1" />
                {todo.estimatedHours}h
              </Badge>
            )}

            {/* Calendar Link */}
            {todo.calendarLinked && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Kalender
              </Badge>
            )}

            {/* Email Source */}
            {todo.emailSource && (
              <Badge variant="outline" className="text-xs">
                <Mail className="h-3 w-3 mr-1" />
                E-Mail
              </Badge>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description (Expandable) */}
          {todo.description && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {isExpanded ? "Weniger anzeigen" : "Beschreibung anzeigen"}
              </Button>

              {isExpanded && (
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap cursor-pointer">
                  {todo.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        taskTitle={todo.title}
      />
    </div>
  );
}
