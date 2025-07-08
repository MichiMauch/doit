"use client";

import { CheckCircle } from "lucide-react";
import { TodoItem } from "./todo-item";
import { type Todo } from "@/lib/db/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

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

  // Handler für Drag & Drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onStatusChange) return;
    const { source, destination, draggableId } = result;
    const id = Number(draggableId);
    // Nur Statuswechsel, wenn Spalte sich ändert
    if (source.droppableId !== destination.droppableId) {
      if (destination.droppableId === "todo") {
        onStatusChange(id, "todo");
      } else if (destination.droppableId === "in_progress") {
        onStatusChange(id, "in_progress");
      } else if (destination.droppableId === "done") {
        onStatusChange(id, "done");
      }
    }
  };

  return (
    <div className="space-y-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Zwei Spalten: Zu erledigen & In Bearbeitung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zu erledigen */}
          <Droppable droppableId="todo">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Zu erledigen ({todoTodos.length})
                  </h2>
                </div>
                <div className={cn(
                  "space-y-3 min-h-[100px] border-2 border-dashed border-transparent transition-colors rounded-lg p-2",
                  snapshot.isDraggingOver && "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                )}>
                  {todoTodos.map((todo, idx) => (
                    <Draggable key={todo.id} draggableId={todo.id.toString()} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.7 : 1,
                            cursor: snapshot.isDragging ? "grabbing" : "grab",
                          }}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            onCelebration={onCelebration}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
          {/* In Bearbeitung */}
          <Droppable droppableId="in_progress">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
                  <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                    In Bearbeitung ({inProgressTodos.length})
                  </h2>
                </div>
                <div className={cn(
                  "space-y-3 min-h-[100px] border-2 border-dashed border-transparent transition-colors rounded-lg p-2",
                  snapshot.isDraggingOver && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                )}>
                  {inProgressTodos.map((todo, idx) => (
                    <Draggable key={todo.id} draggableId={todo.id.toString()} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.7 : 1,
                            cursor: snapshot.isDragging ? "grabbing" : "grab",
                          }}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            onCelebration={onCelebration}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
      {/* Erledigt: unterhalb, volle Breite */}
      <Droppable droppableId="done">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <div className="flex items-center gap-2 mb-3 mt-8">
              <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
              <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">
                Erledigt ({doneTodos.length})
              </h2>
            </div>
            <div className={cn(
              "space-y-3 min-h-[100px] border-2 border-dashed border-transparent transition-colors rounded-lg p-2",
              snapshot.isDraggingOver && "border-green-300 bg-green-50 dark:bg-green-900/20"
            )}>
              {doneTodos.map((todo, idx) => (
                <Draggable key={todo.id} draggableId={todo.id.toString()} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.7 : 1,
                        cursor: snapshot.isDragging ? "grabbing" : "grab",
                      }}
                    >
                      <TodoItem
                        todo={todo}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        onCelebration={onCelebration}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
