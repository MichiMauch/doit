"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { format, addDays, subDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  LogIn,
  LogOut,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  GoogleCalendarService,
  type CalendarEvent,
} from "@/lib/google-calendar";
import { AuthErrorBanner } from "./auth-error-banner";

interface CalendarViewProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function CalendarView({
  selectedDate = new Date(),
  onDateSelect,
  className,
}: CalendarViewProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    reason?: string;
    message?: string;
  }>({ authenticated: false });
  const [authCheckInterval, setAuthCheckInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Authentifizierung prüfen
  const checkAuthentication = async () => {
    if (status === "loading") return false;

    try {
      const authResult = await GoogleCalendarService.checkAuthentication();
      setAuthStatus(authResult);

      // Wenn Token abgelaufen ist, automatisch abmelden
      if (
        authResult.reason === "token_expired" ||
        authResult.reason === "token_invalid"
      ) {
        console.log("🔐 Token expired/invalid, signing out...");
        toast({
          title: "Anmeldung abgelaufen",
          description:
            "Sie werden automatisch abgemeldet und können sich erneut anmelden.",
          variant: "destructive",
        });
        setTimeout(() => signOut({ callbackUrl: "/" }), 2000);
        return false;
      }

      return authResult.authenticated;
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthStatus({
        authenticated: false,
        reason: "check_failed",
        message: "Authentifizierungsprüfung fehlgeschlagen",
      });
      return false;
    }
  };

  // Regelmäßige Auth-Prüfung starten
  useEffect(() => {
    if (session) {
      // Prüfe alle 5 Minuten den Auth-Status
      const interval = setInterval(checkAuthentication, 5 * 60 * 1000);
      setAuthCheckInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Stoppe regelmäßige Prüfung wenn nicht angemeldet
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
        setAuthCheckInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Events für den aktuellen Tag laden
  const loadEventsForDate = async (date: Date) => {
    setIsLoadingEvents(true);
    try {
      // Prüfe Authentifizierung zuerst
      const isAuthenticated = await checkAuthentication();

      // Verwende echte API wenn authentifiziert, sonst Mock-Daten
      let events = await GoogleCalendarService.getEventsForDate(
        date,
        isAuthenticated
      );
      // Filter: Nur Events, die noch nicht vorbei sind
      const now = new Date();
      events = events.filter(event => {
        if (event.isAllDay) {
          // Ganztägige Termine: Zeige nur, wenn Start >= heute
          return event.start >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        // Normale Termine: Zeige nur, wenn Endzeit in der Zukunft liegt
        return event.end > now;
      });
      setEvents(events);
    } catch (error) {
      console.error("Error loading calendar events:", error);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Events laden wenn sich das Datum ändert oder beim ersten Laden
  useEffect(() => {
    // Nur laden wenn die Session-Prüfung abgeschlossen ist
    if (status !== "loading") {
      loadEventsForDate(currentDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, session, status]);

  const goToPreviousDay = () => {
    const newDate = subDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect?.(today);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!session) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um Termine zu löschen.",
        variant: "destructive",
      });
      return;
    }

    setDeletingEventId(event.id);

    try {
      const success = await GoogleCalendarService.deleteEvent(event.id);

      if (success) {
        // Event aus der lokalen Liste entfernen
        setEvents((prevEvents) => prevEvents.filter((e) => e.id !== event.id));

        toast({
          title: "Termin gelöscht",
          description: `"${event.title}" wurde erfolgreich gelöscht.`,
        });
      } else {
        toast({
          title: "Fehler beim Löschen",
          description:
            "Der Termin konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Fehler beim Löschen",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm", className)}>
      {/* Auth Error Banner */}
      {!authStatus.authenticated && authStatus.reason && (
        <AuthErrorBanner
          reason={authStatus.reason}
          message={authStatus.message}
          onRetry={() => loadEventsForDate(currentDate)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Kalender</h3>
          {!authStatus.authenticated && (
            <Badge variant="secondary" className="text-xs">
              Mock-Daten
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Heute
          </Button>

          {/* Authentication Button */}
          {status === "loading" ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : session ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Abmelden
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signIn("google")}
              className="text-xs"
            >
              <LogIn className="h-3 w-3 mr-1" />
              Google
            </Button>
          )}
        </div>
      </div>

      {/* Aktueller Tag */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousDay}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {format(currentDate, "EEEE", { locale: de })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {format(currentDate, "dd. MMMM yyyy", { locale: de })}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextDay}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Events für den aktuellen Tag */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Termine heute</h4>
          {isLoadingEvents && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {event.title}
                    </h5>

                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {event.isAllDay
                          ? "Ganztägig"
                          : `${format(event.start, "HH:mm")} - ${format(
                              event.end,
                              "HH:mm"
                            )}`}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {event.location}
                        </span>
                      </div>
                    )}

                    {event.conferenceData && (
                      <div className="flex items-center gap-1 mt-1">
                        <Video className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Video-Meeting
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    {event.isAllDay && (
                      <Badge variant="secondary" className="text-xs">
                        Ganztägig
                      </Badge>
                    )}

                    {/* Lösch-Button nur wenn angemeldet */}
                    {session && authStatus.authenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event)}
                        disabled={deletingEventId === event.id}
                        className="h-6 w-6 p-0 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Termin löschen"
                      >
                        {deletingEventId === event.id ? (
                          <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            {isLoadingEvents ? "Lade Termine..." : "Keine Termine für heute"}
          </div>
        )}
      </div>

      {/* Google Calendar Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="font-medium">📅 Google Calendar</div>
            {session ? (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-green-600" />
                <span className="text-green-600 dark:text-green-400">Verbunden</span>
              </div>
            ) : (
              <span className="text-orange-600 dark:text-orange-400">Nicht verbunden</span>
            )}
          </div>

          {session ? (
            <div>Zeigt echte Termine aus Ihrem Google Calendar an.</div>
          ) : (
            <div>Melden Sie sich an, um echte Termine anzuzeigen.</div>
          )}
        </div>
      </div>
    </div>
  );
}
