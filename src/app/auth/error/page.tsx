"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "AccessDenied":
        return {
          title: "Zugriff verweigert",
          description: "Diese DOIT-App ist privat und nur für autorisierte Benutzer zugänglich. Bitte verwende das richtige Google-Konto.",
          icon: "🚫"
        };
      case "Configuration":
        return {
          title: "Konfigurationsfehler",
          description: "Es gibt ein Problem mit der Authentifizierungskonfiguration.",
          icon: "⚙️"
        };
      default:
        return {
          title: "Authentifizierungsfehler",
          description: "Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.",
          icon: "❌"
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">{errorInfo.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 font-audiowide tracking-wider mb-2">
            DOIT
          </h1>
          <div className="flex items-center justify-center gap-2 text-danger-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{errorInfo.title}</h2>
          </div>
        </div>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {errorInfo.description}
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = "/auth/signin"}
            className="w-full bg-primary-400 hover:bg-primary-500"
          >
            Erneut anmelden
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Zur Startseite
          </Button>
        </div>

        {error === "AccessDenied" && (
          <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-xs text-warning-800">
              <strong>Hinweis:</strong> Diese App ist nur für den Besitzer zugänglich. 
              Falls du der Besitzer bist, stelle sicher, dass du das richtige Google-Konto verwendest.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto"></div>
          <p className="mt-2 text-gray-600">Lädt...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}