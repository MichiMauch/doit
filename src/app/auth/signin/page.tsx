"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignIn() {
  const handleGoogleSignIn = () => {
    signIn("google", {
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-3xl font-bold text-gray-900 font-audiowide tracking-wider">DOIT</h1>
          <p className="text-gray-600 mt-2">
            Private Task Management App
          </p>
          <p className="text-sm text-warning-700 mt-2 bg-warning-50 border border-warning-200 rounded-lg p-3">
            <strong>Hinweis:</strong> Diese App ist privat und nur für autorisierte Benutzer zugänglich. 🔒
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-primary-400 hover:bg-primary-500"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Mit Google anmelden
          </Button>

          <div className="text-center">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur App
            </Link>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Diese App integriert sich mit Google Calendar für Terminsynchronisation.</p>
          <p>Nur autorisierte Benutzer können sich anmelden.</p>
        </div>
      </div>
    </div>
  );
}
