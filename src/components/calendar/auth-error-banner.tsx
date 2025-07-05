"use client";

import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorBannerProps {
  reason?: string;
  message?: string;
  onRetry?: () => void;
}

export function AuthErrorBanner({
  reason,
  message,
  onRetry,
}: AuthErrorBannerProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const getErrorContent = () => {
    switch (reason) {
      case "insufficient_scope":
        return {
          title: "Kalender-Berechtigungen fehlen",
          description:
            "Ihre Google-Anmeldung hat nicht die nötigen Schreibrechte für den Kalender. Loggen Sie sich bitte aus und wieder ein.",
          showLogout: true,
          variant: "destructive" as const,
        };
      case "token_expired":
      case "token_invalid":
        return {
          title: "Anmeldung abgelaufen",
          description:
            "Ihr Google-Token ist abgelaufen. Sie werden automatisch abgemeldet.",
          showLogout: false,
          variant: "destructive" as const,
        };
      case "no_session":
      case "no_token":
        return {
          title: "Nicht angemeldet",
          description:
            "Sie müssen sich bei Google anmelden, um Kalender-Features zu nutzen.",
          showLogout: false,
          variant: "default" as const,
        };
      case "api_timeout":
        return {
          title: "Verbindung langsam",
          description:
            "Google Calendar antwortet langsam. Bitte haben Sie etwas Geduld.",
          showLogout: false,
          variant: "default" as const,
        };
      case "api_error":
      case "calendar_test_failed":
        return {
          title: "Kalender-Service nicht verfügbar",
          description:
            message ||
            "Google Calendar ist momentan nicht erreichbar. Versuchen Sie es später erneut.",
          showLogout: false,
          variant: "default" as const,
        };
      default:
        return {
          title: "Kalender-Verbindung fehlgeschlagen",
          description:
            message || "Es gab ein Problem mit der Kalender-Verbindung.",
          showLogout: false,
          variant: "default" as const,
        };
    }
  };

  const { title, description, showLogout, variant } = getErrorContent();

  return (
    <Alert variant={variant} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm mt-1">{description}</div>
        </div>
        <div className="flex gap-2 ml-4">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="whitespace-nowrap"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Erneut versuchen
            </Button>
          )}
          {showLogout && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="whitespace-nowrap"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Abmelden & neu anmelden
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
