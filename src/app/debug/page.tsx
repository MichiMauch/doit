"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Session Status:</h3>
            <p className="text-sm text-gray-600">{status}</p>
          </div>
          
          {session && (
            <div>
              <h3 className="font-medium">Session Data:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h3 className="font-medium">Environment Check:</h3>
            <p className="text-sm text-gray-600">
              Check server console for environment variables
            </p>
          </div>
          
          <Button onClick={() => window.location.href = "/"}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}