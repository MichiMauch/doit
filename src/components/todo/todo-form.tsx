"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Tag as TagIcon, Save, X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Todo, type NewTodo } from "@/lib/db/schema";
import { CalendarScheduler } from "@/lib/calendar-scheduling";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { useToast } from "@/hooks/use-toast";

interface TodoFormProps {
  todo?: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    todo: Omit<NewTodo, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  isSaving?: boolean;
}

export function TodoForm({
  todo,
  isOpen,
  onClose,
  onSave,
  isSaving: externalIsSaving,
}: TodoFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");
  const [calendarLinked, setCalendarLinked] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when todo changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || "");
        setPriority((todo.priority as "low" | "medium" | "high") || "medium");
        setEstimatedHours(todo.estimatedHours || "");
        setCalendarLinked(todo.calendarLinked || false);

        if (todo.dueDate) {
          const date = new Date(todo.dueDate);
          setDueDate(format(date, "yyyy-MM-dd"));
          setDueTime(format(date, "HH:mm"));
        } else {
          setDueDate("");
          setDueTime("");
        }

        const todoTags = todo.tags
          ? Array.isArray(todo.tags)
            ? todo.tags
            : JSON.parse(todo.tags as string)
          : [];
        setTags(todoTags);
      } else {
        // Reset for new todo
        setTitle("");
        setDescription("");
        setPriority("medium");
        setEstimatedHours("");
        setDueDate("");
        setDueTime("");
        setCalendarLinked(false);
        setAutoSchedule(false);
        setTags([]);
      }
      setTagInput("");
      setIsSaving(false);
    }
  }, [todo, isOpen]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      let dueDatetime: Date | null = null;
      if (dueDate) {
        dueDatetime = new Date(dueDate);
        if (dueTime) {
          const [hours, minutes] = dueTime.split(":").map(Number);
          dueDatetime.setHours(hours, minutes, 0, 0);
        }
      }

      const todoData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDatetime,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        calendarLinked,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        completed: false,
      };

      await onSave(todoData);

      // Toast für erfolgreich erstelltes Todo
      const toastTitle = todo ? "Aufgabe aktualisiert" : "Aufgabe erstellt";
      const toastDescription = `"${title.trim()}" wurde erfolgreich ${
        todo ? "aktualisiert" : "erstellt"
      }.`;

      // Automatisches Scheduling wenn aktiviert und estimatedHours vorhanden
      if (autoSchedule && estimatedHours && Number(estimatedHours) > 0) {
        try {
          console.log("🗓️ Erstelle automatische Kalendertermine...");

          // Prüfe Authentifizierung
          const authResult = await GoogleCalendarService.checkAuthentication();
          if (!authResult.authenticated) {
            if (authResult.reason === "insufficient_scope") {
              console.warn(
                "⚠️ Unzureichende Google Calendar Berechtigungen - Bitte neu anmelden"
              );
              toast({
                variant: "destructive",
                title: "Kalender-Berechtigung fehlt",
                description:
                  "Bitte loggen Sie sich aus und wieder ein, um automatisches Scheduling zu nutzen.",
              });
            } else {
              console.warn(
                "⚠️ Nicht bei Google Calendar angemeldet - Scheduling übersprungen"
              );
              toast({
                title: toastTitle,
                description:
                  toastDescription +
                  " Für automatisches Scheduling müssen Sie sich bei Google Calendar anmelden.",
              });
            }
            onClose();
            return;
          }

          const schedulingOptions = {
            todoTitle: title.trim(),
            estimatedHours: Number(estimatedHours),
            dueDate: dueDatetime || undefined,
            priority,
          };

          const timeBlocks = await CalendarScheduler.scheduleTask(
            schedulingOptions
          );

          if (timeBlocks.length > 0) {
            console.log(`📅 ${timeBlocks.length} Zeitblöcke geplant`);
            const success = await CalendarScheduler.createCalendarEvents(
              timeBlocks
            );

            if (success) {
              console.log(`✅ Kalendertermine erfolgreich erstellt`);

              // Formatiere die geplanten Zeiten für die Toast-Nachricht
              const scheduleInfo = timeBlocks
                .map((block) => {
                  const startDate = format(block.start, "dd.MM.yyyy");
                  const startTime = format(block.start, "HH:mm");
                  const endTime = format(block.end, "HH:mm");
                  return `${startDate} von ${startTime} - ${endTime}`;
                })
                .join(", ");

              toast({
                variant: "success",
                title: `${toastTitle} & Arbeitszeit geplant`,
                description: `"${title.trim()}" wurde erstellt und automatisch für ${scheduleInfo} geplant.`,
              });
            } else {
              console.warn(
                "⚠️ Einige Kalendertermine konnten nicht erstellt werden"
              );
              toast({
                title: toastTitle,
                description:
                  toastDescription +
                  " Einige Kalendertermine konnten jedoch nicht erstellt werden.",
              });
            }
          } else {
            console.warn("⚠️ Keine verfügbaren Zeitslots gefunden");
            toast({
              title: toastTitle,
              description:
                toastDescription +
                " Es konnten jedoch keine freien Zeitslots für das automatische Scheduling gefunden werden.",
            });
          }
        } catch (schedulingError) {
          console.error(
            "❌ Fehler beim automatischen Scheduling:",
            schedulingError
          );
          toast({
            variant: "destructive",
            title: "Scheduling-Fehler",
            description:
              "Die Aufgabe wurde erstellt, aber beim automatischen Scheduling ist ein Fehler aufgetreten.",
          });
        }
      } else {
        // Einfacher Toast wenn kein Scheduling
        toast({
          title: toastTitle,
          description: toastDescription,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error in TodoForm handleSubmit:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Beim Speichern der Aufgabe ist ein Fehler aufgetreten.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const priorityOptions = [
    { value: "low", label: "Niedrig", color: "bg-green-500" },
    { value: "medium", label: "Mittel", color: "bg-yellow-500" },
    { value: "high", label: "Hoch", color: "bg-red-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {todo ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
          </DialogTitle>
          <DialogDescription>
            {todo
              ? "Bearbeite die Details deiner Aufgabe."
              : "Erstelle eine neue Aufgabe für deine To-do-Liste."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was möchtest du erledigen?"
              required
            />
          </div>

          {/* Beschreibung */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Weitere Details zur Aufgabe..."
              rows={3}
            />
          </div>

          {/* Priorität */}
          <div className="space-y-2">
            <Label>Priorität</Label>
            <Select
              value={priority}
              onValueChange={(value: string) =>
                setPriority(value as "low" | "medium" | "high")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zeitestimation */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">
              <Timer className="h-4 w-4 inline mr-1" />
              Geschätzte Stunden
            </Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.25"
              value={estimatedHours}
              onChange={(e) =>
                setEstimatedHours(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="z.B. 2.5"
            />
            <p className="text-xs text-gray-500">
              Wie viele Stunden schätzt du für diese Aufgabe?
            </p>
          </div>

          {/* Fälligkeitsdatum und Zeit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fälligkeitsdatum
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">
                <Clock className="h-4 w-4 inline mr-1" />
                Uhrzeit
              </Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!dueDate}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tag hinzufügen..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Hinzufügen
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Optionen */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="calendarLinked"
                checked={calendarLinked}
                onCheckedChange={(checked) =>
                  setCalendarLinked(checked as boolean)
                }
              />
              <Label htmlFor="calendarLinked">Mit Kalender verknüpfen</Label>
            </div>

            {estimatedHours && Number(estimatedHours) > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoSchedule"
                  checked={autoSchedule}
                  onCheckedChange={(checked) =>
                    setAutoSchedule(checked as boolean)
                  }
                />
                <Label htmlFor="autoSchedule" className="text-sm">
                  Automatisch Arbeitszeit im Kalender blockieren
                </Label>
              </div>
            )}

            {autoSchedule && (
              <div className="ml-6 text-xs text-gray-600 space-y-1">
                {estimatedHours && Number(estimatedHours) > 4 && (
                  <p>
                    💡 Aufgaben über 4h werden automatisch in kleinere Blöcke
                    aufgeteilt
                  </p>
                )}
                <p>
                  📅 Benötigt Google Calendar-Anmeldung mit Schreibberechtigung
                </p>
                <p>
                  🔒 Bei Fehlern: Bitte ab- und neu anmelden für erweiterte
                  Berechtigungen
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSaving || externalIsSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || externalIsSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
