"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Settings, 
  ExternalLink, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  X,
  Loader2,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface JiraIssue {
  id: number;
  jiraId: string;
  key: string;
  summary: string;
  description: string | null;
  status: string;
  priority: string | null;
  assignee: string | null;
  project: string;
  issueType: string;
  dueDate: string | null;
  sprint: string | null;
  sprintState: string | null;
}

interface JiraConfig {
  url: string;
  email: string;
  token: string;
}

interface ConfigModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tempConfig: JiraConfig;
  onConfigChange: (config: JiraConfig) => void;
  onSave: () => void;
  isLoading: boolean;
  error: string | null;
}

function ConfigModal({ 
  isOpen, 
  onOpenChange, 
  tempConfig, 
  onConfigChange, 
  onSave, 
  isLoading, 
  error 
}: ConfigModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Jira Konfiguration
          </DialogTitle>
          <DialogDescription>
            Gib deine Jira-Zugangsdaten ein, um Issues zu synchronisieren.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jira-url">Jira URL</Label>
            <Input
              id="jira-url"
              placeholder="https://firma.atlassian.net"
              value={tempConfig.url}
              onChange={(e) => onConfigChange({ ...tempConfig, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jira-email">E-Mail</Label>
            <Input
              id="jira-email"
              type="email"
              placeholder="deine@email.com"
              value={tempConfig.email}
              onChange={(e) => onConfigChange({ ...tempConfig, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jira-token">API Token</Label>
            <Input
              id="jira-token"
              type="password"
              placeholder="Dein Jira API Token"
              value={tempConfig.token}
              onChange={(e) => onConfigChange({ ...tempConfig, token: e.target.value })}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={onSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SimpleJiraPanel() {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Config state
  const [config, setConfig] = useState<JiraConfig | null>(null);
  const [configForm, setConfigForm] = useState({ url: "", email: "", token: "" });
  const [tempConfigForm, setTempConfigForm] = useState({ url: "", email: "", token: "" });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  
  // Projects state
  const [projects, setProjects] = useState<string[]>([]);
  const [newProject, setNewProject] = useState("");
  const [isManagingProjects, setIsManagingProjects] = useState(false);
  
  // Blacklist state
  const [blacklistedIssues, setBlacklistedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfig();
    loadProjects();
    loadBlacklist();
  }, []);

  useEffect(() => {
    if (config && projects.length > 0) {
      loadIssues();
    }
  }, [config, projects]);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem("jira-config");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setConfigForm(parsedConfig);
      setTempConfigForm(parsedConfig);
    }
  };

  const openConfigModal = () => {
    setTempConfigForm(configForm);
    setIsConfigModalOpen(true);
    setError(null);
  };

  const loadProjects = () => {
    const savedProjects = localStorage.getItem("jira-projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  };

  const loadBlacklist = () => {
    const savedBlacklist = localStorage.getItem("jira-blacklist");
    if (savedBlacklist) {
      setBlacklistedIssues(new Set(JSON.parse(savedBlacklist)));
    }
  };

  const saveConfig = async () => {
    if (!tempConfigForm.url || !tempConfigForm.email || !tempConfigForm.token) {
      setError("Alle Felder sind erforderlich");
      return;
    }

    setIsConfigLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jira/simple-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempConfigForm),
      });

      if (response.ok) {
        localStorage.setItem("jira-config", JSON.stringify(tempConfigForm));
        setConfig(tempConfigForm);
        setConfigForm(tempConfigForm);
        setIsConfigModalOpen(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Fehler beim Speichern der Konfiguration");
      }
    } catch (error) {
      setError("Fehler beim Speichern der Konfiguration");
    } finally {
      setIsConfigLoading(false);
    }
  };

  const loadIssues = async () => {
    if (!config || projects.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jira/simple-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          projects
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out blacklisted issues
        const filteredIssues = (data.issues || []).filter((issue: JiraIssue) => 
          !blacklistedIssues.has(issue.jiraId)
        );
        setIssues(filteredIssues);
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync));
        }
      } else {
        const data = await response.json();
        setError(data.error || "Fehler beim Laden der Issues");
      }
    } catch (error) {
      setError("Fehler beim Laden der Issues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!config || projects.length === 0) {
      setError("Konfiguration und Projekte sind erforderlich");
      return;
    }

    setIsSyncing(true);
    await loadIssues();
    setIsSyncing(false);
  };

  const addProject = () => {
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      const updatedProjects = [...projects, newProject.trim()];
      localStorage.setItem("jira-projects", JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setNewProject("");
    }
  };

  const removeProject = (projectToRemove: string) => {
    const updatedProjects = projects.filter(p => p !== projectToRemove);
    localStorage.setItem("jira-projects", JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const addToBlacklist = (issueId: string) => {
    const updatedBlacklist = new Set(blacklistedIssues);
    updatedBlacklist.add(issueId);
    localStorage.setItem("jira-blacklist", JSON.stringify(Array.from(updatedBlacklist)));
    setBlacklistedIssues(updatedBlacklist);
    // Remove from current issues list
    setIssues(issues.filter(issue => issue.jiraId !== issueId));
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case "highest":
      case "high":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "medium":
        return <Minus className="h-4 w-4 text-yellow-500" />;
      case "low":
      case "lowest":
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("done") || statusLower.includes("closed")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (statusLower.includes("progress")) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getJiraUrl = (issue: JiraIssue) => {
    return config ? `${config.url}/browse/${issue.key}` : "#";
  };


  if (!config) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <span>Jira Issues</span>
            <Button variant="outline" size="sm" onClick={openConfigModal}>
              <Settings className="h-4 w-4 mr-2" />
              Konfigurieren
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Jira ist noch nicht konfiguriert. Klicke auf "Konfigurieren".
            </AlertDescription>
          </Alert>
        </CardContent>
        <ConfigModal
          isOpen={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          tempConfig={tempConfigForm}
          onConfigChange={setTempConfigForm}
          onSave={saveConfig}
          isLoading={isConfigLoading}
          error={error}
        />
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <span>Jira Issues</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openConfigModal}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || projects.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        </CardTitle>
        
        {/* Project Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Projekte ({projects.length})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsManagingProjects(!isManagingProjects)}
            >
              {isManagingProjects ? "Fertig" : "Verwalten"}
            </Button>
          </div>
          
          {projects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {projects.map((project) => (
                <Badge key={project} variant="secondary" className="text-xs">
                  {project}
                  {isManagingProjects && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeProject(project)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          
          {isManagingProjects && (
            <div className="flex gap-2">
              <Input
                placeholder="Projekt-Key (z.B. ECO2025)"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addProject()}
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={addProject} disabled={!newProject.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {lastSync && (
          <p className="text-sm text-gray-500">
            Letzte Synchronisation: {format(lastSync, "dd.MM.yyyy HH:mm", { locale: de })}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Keine offenen Issues gefunden</p>
            <p className="text-sm">
              {projects.length > 0
                ? `Keine Issues in ${projects.join(", ")}`
                : "Füge Projekte hinzu und synchronisiere"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.jiraId} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <span className="font-medium text-sm">{issue.key}</span>
                    <Badge variant="outline" className="text-xs">{issue.project}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(issue.priority)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => addToBlacklist(issue.jiraId)}
                      title="Issue ausblenden"
                    >
                      <EyeOff className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(getJiraUrl(issue), "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-medium mb-2 text-sm leading-tight">{issue.summary}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <Badge variant="secondary" className="text-xs">{issue.status}</Badge>
                  {issue.priority && (
                    <Badge variant="outline" className="text-xs">{issue.priority}</Badge>
                  )}
                  {issue.sprint && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Sprint: {issue.sprint}
                    </Badge>
                  )}
                  {issue.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(issue.dueDate), "dd.MM.yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <ConfigModal
        isOpen={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
        tempConfig={tempConfigForm}
        onConfigChange={setTempConfigForm}
        onSave={saveConfig}
        isLoading={isConfigLoading}
        error={error}
      />
    </Card>
  );
}