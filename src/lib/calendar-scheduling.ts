/**
 * Automatische Kalendertermin-Erstellung für Todos
 * 
 * Diese Datei enthält die Logik für das automatische Erstellen von
 * Kalenderterminen basierend auf Zeitschätzungen und Deadlines.
 */

import { GoogleCalendarService, type CalendarEvent } from "./google-calendar";
import { addDays, setHours, setMinutes, isBefore, isAfter, addHours } from "date-fns";

export interface TimeBlock {
  start: Date;
  end: Date;
  duration: number; // in Stunden
  title: string;
  description?: string;
}

export interface SchedulingOptions {
  todoTitle: string;
  estimatedHours: number;
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  workingHours?: {
    start: number; // Stunde (z.B. 9)
    end: number;   // Stunde (z.B. 17)
  };
  maxBlockSize?: number; // Maximale Blockgröße in Stunden (default: 4)
  minBlockSize?: number; // Minimale Blockgröße in Stunden (default: 0.5)
}

export class CalendarScheduler {
  private static readonly DEFAULT_WORKING_HOURS = {
    start: 8.75,  // 08:45 (8 + 45/60 = 8.75)
    end: 17       // 17:00
  };

  private static readonly LUNCH_BREAK = {
    start: 12,    // 12:00
    end: 13.25    // 13:15 (13 + 15/60 = 13.25)
  };

  private static readonly DEFAULT_MAX_BLOCK_SIZE = 4;
  private static readonly DEFAULT_MIN_BLOCK_SIZE = 0.5;

  /**
   * Erstellt automatisch Kalendertermine für eine Aufgabe
   */
  static async scheduleTask(options: SchedulingOptions): Promise<TimeBlock[]> {
    const {
      todoTitle,
      estimatedHours,
      dueDate,
      priority,
      workingHours = this.DEFAULT_WORKING_HOURS,
      maxBlockSize = this.DEFAULT_MAX_BLOCK_SIZE,
      minBlockSize = this.DEFAULT_MIN_BLOCK_SIZE
    } = options;

    // Aufgabe in Blöcke aufteilen
    const blocks = this.splitIntoBlocks(estimatedHours, maxBlockSize, minBlockSize);
    
    // Startdatum für die Planung bestimmen
    const planningStartDate = this.determinePlanningStartDate(dueDate, blocks.length);
    
    // Bestehende Termine laden um Konflikte zu vermeiden
    const existingEvents = await this.getExistingEvents(planningStartDate, dueDate);
    
    // Zeitblöcke in verfügbare Slots einplanen
    const scheduledBlocks = this.scheduleBlocks(
      blocks,
      planningStartDate,
      dueDate,
      existingEvents,
      workingHours,
      todoTitle,
      priority
    );

    return scheduledBlocks;
  }

  /**
   * Teilt eine große Aufgabe in kleinere Blöcke auf
   */
  private static splitIntoBlocks(
    totalHours: number,
    maxBlockSize: number,
    minBlockSize: number
  ): number[] {
    const blocks: number[] = [];
    let remainingHours = totalHours;

    while (remainingHours > 0) {
      if (remainingHours <= maxBlockSize) {
        // Letzter Block - verwende die verbleibende Zeit
        if (remainingHours >= minBlockSize) {
          blocks.push(remainingHours);
        } else {
          // Zu kleiner Rest - füge zur letzten Blockgröße hinzu
          if (blocks.length > 0) {
            blocks[blocks.length - 1] += remainingHours;
          } else {
            blocks.push(remainingHours);
          }
        }
        break;
      } else {
        // Erstelle einen Block mit maximaler Größe
        blocks.push(maxBlockSize);
        remainingHours -= maxBlockSize;
      }
    }

    return blocks;
  }

  /**
   * Bestimmt das Startdatum für die Planung
   */
  private static determinePlanningStartDate(dueDate?: Date, blocksCount: number = 1): Date {
    const now = new Date();
    
    if (dueDate) {
      // Mit Deadline: Plane rückwärts
      // Schätze dass wir mindestens 1 Tag pro Block brauchen
      const estimatedDays = Math.max(1, blocksCount);
      const startDate = addDays(dueDate, -estimatedDays);
      
      // Aber nicht in der Vergangenheit planen
      return isBefore(startDate, now) ? now : startDate;
    } else {
      // Ohne Deadline: Starte ab morgen
      return addDays(now, 1);
    }
  }

  /**
   * Lädt bestehende Ereignisse für den Planungszeitraum
   */
  private static async getExistingEvents(startDate: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      const finalEndDate = endDate || addDays(startDate, 14); // 2 Wochen Standard-Fenster
      
      // Lade bestehende Events für den Zeitraum
      return await GoogleCalendarService.getEventsForDateRange(startDate, finalEndDate);
    } catch (error) {
      console.error("Error loading existing events:", error);
      return [];
    }
  }

  /**
   * Plant die Zeitblöcke in verfügbare Slots ein
   */
  private static scheduleBlocks(
    blocks: number[],
    startDate: Date,
    dueDate: Date | undefined,
    existingEvents: CalendarEvent[],
    workingHours: { start: number; end: number },
    todoTitle: string,
    priority: "low" | "medium" | "high"
  ): TimeBlock[] {
    const scheduledBlocks: TimeBlock[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < blocks.length; i++) {
      const blockDuration = blocks[i];
      const blockNumber = blocks.length > 1 ? ` (Teil ${i + 1}/${blocks.length})` : '';
      
      // Finde den nächsten verfügbaren Slot
      const timeSlot = this.findAvailableTimeSlot(
        currentDate,
        blockDuration,
        existingEvents,
        workingHours,
        dueDate
      );

      if (timeSlot) {
        const priorityPrefix = priority === 'high' ? '🔴 ' : priority === 'medium' ? '🟡 ' : '🟢 ';
        
        scheduledBlocks.push({
          start: timeSlot.start,
          end: timeSlot.end,
          duration: blockDuration,
          title: `${priorityPrefix}${todoTitle}${blockNumber}`,
          description: `Arbeitszeit für: ${todoTitle}\nGeschätzte Dauer: ${blockDuration}h\nPriorität: ${priority}`
        });

        // Setze das nächste Startdatum auf den Tag nach diesem Block
        currentDate = addDays(timeSlot.end, 1);
      } else {
        console.warn(`Could not find available time slot for block ${i + 1}`);
      }
    }

    return scheduledBlocks;
  }

  /**
   * Findet den nächsten verfügbaren Zeitslot
   */
  private static findAvailableTimeSlot(
    searchDate: Date,
    duration: number,
    existingEvents: CalendarEvent[],
    workingHours: { start: number; end: number },
    deadline?: Date
  ): { start: Date; end: Date } | null {
    let currentSearchDate = new Date(searchDate);
    const maxSearchDays = 30; // Maximal 30 Tage in die Zukunft suchen

    for (let day = 0; day < maxSearchDays; day++) {
      // Überspringe Nicht-Arbeitstage (Freitag = 5, Samstag = 6, Sonntag = 0)
      const dayOfWeek = currentSearchDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        currentSearchDate = addDays(currentSearchDate, 1);
        continue;
      }

      // Prüfe ob wir noch vor der Deadline sind
      if (deadline && isAfter(currentSearchDate, deadline)) {
        return null; // Keine Zeit mehr vor der Deadline
      }

      // Versuche einen Slot an diesem Tag zu finden
      const slot = this.findSlotInDay(
        currentSearchDate,
        duration,
        existingEvents,
        workingHours
      );

      if (slot) {
        return slot;
      }

      currentSearchDate = addDays(currentSearchDate, 1);
    }

    return null; // Kein verfügbarer Slot gefunden
  }

  /**
   * Sucht einen verfügbaren Slot an einem bestimmten Tag
   */
  private static findSlotInDay(
    date: Date,
    duration: number,
    existingEvents: CalendarEvent[],
    workingHours: { start: number; end: number }
  ): { start: Date; end: Date } | null {
    // Arbeitszeiten korrekt setzen (8.75 = 08:45)
    const startHour = Math.floor(workingHours.start);
    const startMinutes = Math.round((workingHours.start - startHour) * 60);
    const endHour = Math.floor(workingHours.end);
    const endMinutes = Math.round((workingHours.end - endHour) * 60);
    
    const workStart = setHours(setMinutes(new Date(date), startMinutes), startHour);
    const workEnd = setHours(setMinutes(new Date(date), endMinutes), endHour);
    
    // Mittagspause definieren
    const lunchStartHour = Math.floor(this.LUNCH_BREAK.start);
    const lunchStartMinutes = Math.round((this.LUNCH_BREAK.start - lunchStartHour) * 60);
    const lunchEndHour = Math.floor(this.LUNCH_BREAK.end);
    const lunchEndMinutes = Math.round((this.LUNCH_BREAK.end - lunchEndHour) * 60);
    
    const lunchStart = setHours(setMinutes(new Date(date), lunchStartMinutes), lunchStartHour);
    const lunchEnd = setHours(setMinutes(new Date(date), lunchEndMinutes), lunchEndHour);
    
    // Events für diesen Tag filtern und Mittagspause hinzufügen
    const dayEvents = existingEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });

    // Mittagspause als "Event" hinzufügen
    const lunchBreakEvent: CalendarEvent = {
      id: 'lunch-break',
      title: 'Mittagspause',
      start: lunchStart,
      end: lunchEnd,
    };
    dayEvents.push(lunchBreakEvent);

    // Sortiere Events nach Startzeit
    dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    let searchStart = workStart;

    for (const event of dayEvents) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Prüfe ob zwischen searchStart und eventStart genug Zeit ist
      const availableHours = (eventStart.getTime() - searchStart.getTime()) / (1000 * 60 * 60);
      
      if (availableHours >= duration) {
        const slotEnd = addHours(searchStart, duration);
        if (isBefore(slotEnd, eventStart)) {
          return { start: searchStart, end: slotEnd };
        }
      }

      // Setze searchStart auf das Ende des aktuellen Events
      searchStart = new Date(Math.max(searchStart.getTime(), eventEnd.getTime()));
    }

    // Prüfe den Slot nach dem letzten Event bis zum Arbeitsende
    const remainingHours = (workEnd.getTime() - searchStart.getTime()) / (1000 * 60 * 60);
    if (remainingHours >= duration) {
      const slotEnd = addHours(searchStart, duration);
      if (!isAfter(slotEnd, workEnd)) {
        return { start: searchStart, end: slotEnd };
      }
    }

    return null;
  }

  /**
   * Erstellt die geplanten Blöcke als echte Kalendertermine
   */
  static async createCalendarEvents(timeBlocks: TimeBlock[]): Promise<boolean> {
    if (timeBlocks.length === 0) {
      console.warn('⚠️ No time blocks to create');
      return true;
    }

    // Prüfe zuerst die Authentifizierung
    const authResult = await GoogleCalendarService.checkAuthentication();
    if (!authResult.authenticated) {
      if (authResult.reason === 'insufficient_scope') {
        console.error('❌ Insufficient Google Calendar permissions. Please re-authenticate.');
        throw new Error('Unzureichende Google Calendar Berechtigungen. Bitte melden Sie sich erneut an.');
      } else {
        console.error('❌ Not authenticated with Google Calendar');
        throw new Error('Nicht bei Google Calendar angemeldet');
      }
    }

    let successCount = 0;
    const totalBlocks = timeBlocks.length;

    console.log(`🗓️ Creating ${totalBlocks} calendar events...`);

    try {
      for (const block of timeBlocks) {
        const eventData = {
          summary: block.title,
          description: block.description || '',
          start: {
            dateTime: block.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: block.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          colorId: '4', // Blau für Arbeitsblöcke
        };

        // Erstelle das Event über die Google Calendar API
        const createdEvent = await GoogleCalendarService.createEvent(eventData);
        
        if (createdEvent) {
          successCount++;
          console.log(`✅ Created calendar event ${successCount}/${totalBlocks}: ${createdEvent.title}`);
        } else {
          console.warn(`⚠️ Failed to create calendar event: ${block.title}`);
          // Nicht abbrechen, sondern weitermachen mit den anderen Events
        }
      }

      if (successCount === totalBlocks) {
        console.log(`🎉 All ${totalBlocks} calendar events created successfully!`);
        return true;
      } else if (successCount > 0) {
        console.log(`⚠️ Partial success: ${successCount}/${totalBlocks} events created`);
        return true; // Teilweise erfolgreich ist auch OK
      } else {
        console.error('❌ No calendar events could be created');
        return false;
      }
    } catch (error) {
      console.error('💥 Error creating calendar events:', error);
      return successCount > 0; // Wenn mindestens ein Event erstellt wurde, ist es ein Teilerfolg
    }
  }
}
