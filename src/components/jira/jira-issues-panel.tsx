"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { JiraConfigModal } from "./jira-config-modal";
import { type JiraIssue } from "@/lib/db/schema";
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
  X
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface JiraIssuesPanelProps {
  selectedProjects?: string[];
}

export function JiraIssuesPanel({ selectedProjects = [] }: JiraIssuesPanelProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [newProject, setNewProject] = useState("");
  const [isManagingProjects, setIsManagingProjects] = useState(false);
  const [jiraUrl, setJiraUrl] = useState("");

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    if (isConfigured) {
      loadProjects();
      loadIssues();
    }
  }, [isConfigured]);

  useEffect(() => {
    if (isConfigured && projects.length > 0) {
      loadIssues();
    }
  }, [projects]);

  const checkConfiguration = async () => {
    try {
      const response = await fetch("/api/jira/config");
      if (response.ok) {
        const config = await response.json();
        setIsConfigured(config.configured);
        if (config.configured && config.url) {
          setJiraUrl(config.url);
        }
        if (!config.configured) {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error checking Jira configuration:", error);
      setIsLoading(false);
    }
  };

  const loadProjects = () => {
    // Load saved projects from localStorage
    const savedProjects = localStorage.getItem("jira-projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  };

  const saveProjects = (newProjects: string[]) => {
    localStorage.setItem("jira-projects", JSON.stringify(newProjects));
    setProjects(newProjects);
  };

  const addProject = () => {
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      const updatedProjects = [...projects, newProject.trim()];
      saveProjects(updatedProjects);
      setNewProject("");
    }
  };

  const removeProject = (projectToRemove: string) => {
    const updatedProjects = projects.filter(p => p !== projectToRemove);
    saveProjects(updatedProjects);
  };

  const loadIssues = async (forceSync = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (projects.length > 0) {
        params.set("projects", projects.join(","));
      }
      if (forceSync) {
        params.set("sync", "true");
      }

      const response = await fetch(`/api/jira/issues?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        // Filter out completed/closed issues
        const openIssues = (data.issues || []).filter((issue: JiraIssue) => {
          const status = issue.status.toLowerCase();
          return !status.includes("done") && 
                 !status.includes("closed") && 
                 !status.includes("resolved") &&
                 !status.includes("complete");
        });
        setIssues(openIssues);
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load issues");
      }
    } catch (error) {
      console.error("Error loading Jira issues:", error);
      setError("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (projects.length === 0) {
      setError("Bitte füge mindestens ein Projekt hinzu");
      return;
    }
    
    setIsSyncing(true);
    try {
      const response = await fetch("/api/jira/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projects }),
      });

      if (response.ok) {
        await loadIssues();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to sync issues");
      }
    } catch (error) {
      console.error("Error syncing Jira issues:", error);
      setError("Failed to sync issues");
    } finally {
      setIsSyncing(false);
    }
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
    return `${jiraUrl}/browse/${issue.key}`;
  };

  if (!isConfigured) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <span>Jira Issues</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Konfigurieren
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Jira ist noch nicht konfiguriert. Klicke auf "Konfigurieren", um deine Jira-Verbindung einzurichten.
            </AlertDescription>
          </Alert>
        </CardContent>
        <JiraConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigured={() => {
            setIsConfigured(true);
            loadIssues();
          }}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
            >
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
                placeholder="Projekt-Key (z.B. TEST)"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addProject()}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addProject}
                disabled={!newProject.trim()}
              >
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
              <div key={i} className="border rounded-lg p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Keine offenen Jira Issues gefunden</p>
            <p className="text-sm">
              {projects.length > 0
                ? `Keine offenen Issues in den Projekten (${projects.join(", ")})`
                : "Bitte füge Projekte hinzu und synchronisiere"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <span className="font-medium text-sm">
                      {issue.key}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {issue.project}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(issue.priority)}
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

                <h3 className="font-medium mb-2 text-sm leading-tight">
                  {issue.summary}
                </h3>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <Badge variant="secondary" className="text-xs">
                    {issue.status}
                  </Badge>
                  
                  {issue.priority && (
                    <Badge variant="outline" className="text-xs">
                      {issue.priority}
                    </Badge>
                  )}

                  {issue.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(issue.dueDate), "dd.MM.yyyy")}</span>
                    </div>
                  )}
                </div>

                {issue.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {issue.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <JiraConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigured={() => {
          setIsConfigured(true);
          loadIssues();
        }}
      />
    </Card>
  );
}