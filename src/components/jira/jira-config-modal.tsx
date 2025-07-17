"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, ExternalLink } from "lucide-react";

interface JiraConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
}

export function JiraConfigModal({ isOpen, onClose, onConfigured }: JiraConfigModalProps) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/jira/config");
      if (response.ok) {
        const config = await response.json();
        if (config.configured) {
          setUrl(config.url);
          setEmail(config.email);
          setIsConfigured(true);
        }
      }
    } catch (error) {
      console.error("Error loading Jira config:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jira/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, email, token }),
      });

      if (response.ok) {
        setIsConfigured(true);
        onConfigured();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save configuration");
      }
    } catch {
      setError("Failed to save configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Jira Konfiguration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isConfigured && (
            <Alert>
              <AlertDescription>
                Jira ist bereits konfiguriert. Gib neue Daten ein, um die Konfiguration zu ändern.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="jira-url">Jira URL</Label>
            <Input
              id="jira-url"
              type="url"
              placeholder="https://your-domain.atlassian.net"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira-email">E-Mail</Label>
            <Input
              id="jira-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira-token">API Token</Label>
            <Input
              id="jira-token"
              type="password"
              placeholder="Dein Jira API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Erstelle einen API Token in deinen{" "}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Atlassian Account Einstellungen
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !url || !email || !token}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}