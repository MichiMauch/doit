"use client";

import { CheckCircle } from "lucide-react";
import { TodoItem } from "./todo-item";
import { type Todo } from "@/lib/db/schema";
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SortableItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (id: number, status: "todo" | "in_progress" | "done") => void;
  onCelebration?: (taskTitle: string) => void;
}

function SortableItem({ todo, onToggle, onEdit, onDelete, onStatusChange, onCelebration }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onCelebration={onCelebration}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  title: string;
  count: number;
  color: string;
}

function DroppableColumn({ id, children, title, count, color }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
        <h2 className={cn(
          "text-lg font-semibold",
          color.includes("blue") && "text-gray-900 dark:text-white",
          color.includes("yellow") && "text-yellow-700 dark:text-yellow-300",
          color.includes("green") && "text-green-700 dark:text-green-300"
        )}>
          {title} ({count})
        </h2>
      </div>
      <div className={cn(
        "space-y-3 min-h-[100px] border-2 border-dashed border-transparent transition-colors rounded-lg p-2",
        isOver && color.includes("blue") && "border-blue-300 bg-blue-50 dark:bg-blue-900/20",
        isOver && color.includes("yellow") && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20",
        isOver && color.includes("green") && "border-green-300 bg-green-50 dark:bg-green-900/20"
      )}>
        {children}
      </div>
    </div>
  );
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  onStatusChange?: (id: number, status: "todo" | "in_progress" | "done") => void;
  onCelebration?: (taskTitle: string) => void;
}

export function TodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
  isLoading,
  onStatusChange,
  onCelebration,
}: TodoListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Aufgaben gefunden
        </h3>
        <p className="text-gray-500">
          Prima! Du hast alle Aufgaben erledigt oder noch keine erstellt.
        </p>
      </div>
    );
  }

  // Gruppiere nach Status und sortiere
  const todoTodos = todos
    .filter((t) => t.status === "todo" && !t.completed)
    .sort((a, b) => {
      // Sortiere nach Priorität: high -> medium -> low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Höhere Priorität zuerst
      }
      
      // Bei gleicher Priorität: nach Fälligkeitsdatum
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1; // Tasks mit Fälligkeitsdatum zuerst
      if (b.dueDate) return 1;
      
      // Zuletzt: nach Erstellungsdatum (neueste zuerst)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
  const inProgressTodos = todos
    .filter((t) => t.status === "in_progress" && !t.completed)
    .sort((a, b) => {
      // Sortiere nach Priorität: high -> medium -> low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Höhere Priorität zuerst
      }
      
      // Bei gleicher Priorität: nach Fälligkeitsdatum
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1; // Tasks mit Fälligkeitsdatum zuerst
      if (b.dueDate) return 1;
      
      // Zuletzt: nach Erstellungsdatum (neueste zuerst)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
  const doneTodos = todos
    .filter((t) => t.status === "done" || t.completed)
    .sort((a, b) => {
      // Sortiere nach updatedAt (zuletzt abgeschlossen zuerst)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 10); // Beschränke auf maximal 10 erledigte Tasks

  // Handler für Drag Events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onStatusChange) return;

    const todoId = Number(active.id);
    const overId = String(over.id);

    // Check if dropped on a different status column
    if (overId === "todo-column" || overId === "in_progress-column" || overId === "done-column") {
      const newStatus = overId.replace("-column", "") as "todo" | "in_progress" | "done";
      const draggedTodo = todos.find(t => t.id === todoId);
      
      if (draggedTodo && draggedTodo.status !== newStatus) {
        // Trigger celebration if task is being completed
        if (newStatus === "done" && draggedTodo.status !== "done" && !draggedTodo.completed && onCelebration) {
          onCelebration(draggedTodo.title);
        }
        onStatusChange(todoId, newStatus);
      }
    }
  };

  const activeTodo = activeId ? todos.find(t => t.id === Number(activeId)) : null;

  return (
    <div className="space-y-8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Zwei Spalten: Zu erledigen & In Bearbeitung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zu erledigen */}
          <DroppableColumn 
            id="todo-column" 
            title="Zu erledigen" 
            count={todoTodos.length}
            color="bg-blue-400"
          >
            <SortableContext items={todoTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {todoTodos.map((todo) => (
                <SortableItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onCelebration={onCelebration}
                />
              ))}
            </SortableContext>
          </DroppableColumn>

          {/* In Bearbeitung */}
          <DroppableColumn 
            id="in_progress-column" 
            title="In Bearbeitung" 
            count={inProgressTodos.length}
            color="bg-yellow-400"
          >
            <SortableContext items={inProgressTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {inProgressTodos.map((todo) => (
                <SortableItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onCelebration={onCelebration}
                />
              ))}
            </SortableContext>
          </DroppableColumn>
        </div>

        {/* Erledigt: unterhalb, volle Breite */}
        <DroppableColumn 
          id="done-column" 
          title="Erledigt" 
          count={doneTodos.length}
          color="bg-green-400"
        >
          <SortableContext items={doneTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {doneTodos.map((todo) => (
              <SortableItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onCelebration={onCelebration}
              />
            ))}
          </SortableContext>
        </DroppableColumn>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTodo ? (
            <div className="opacity-90 transform rotate-3">
              <TodoItem
                todo={activeTodo}
                onToggle={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onStatusChange={() => {}}
                onCelebration={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}