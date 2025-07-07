"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  GitBranch, 
  Clock, 
  Package, 
  Calendar,
  Copy,
  Check
} from "lucide-react";

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
}

interface VersionInfo {
  version: string;
  buildTime: string;
  gitHash: string;
  branch: string;
  commits: CommitInfo[];
}

export default function VersionPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  const fetchVersionInfo = async () => {
    try {
      const response = await fetch('/api/version');
      const data = await response.json();
      setVersionInfo(data);
    } catch (error) {
      console.error('Failed to fetch version info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading version information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Version & Changelog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Aktuelle Version und Entwicklungshistorie der DOIT Anwendung
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-300 dark:border-gray-600"
            >
              Zurück
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {versionInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Version Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  v{versionInfo.version}
                </div>
                <Badge className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200">
                  Aktuelle Version
                </Badge>
              </CardContent>
            </Card>

            {/* Build Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Build Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Build Zeit</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(versionInfo.buildTime).toLocaleString('de-DE')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Git Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {versionInfo.gitHash.slice(0, 7)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(versionInfo.gitHash)}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Git Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Git Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Branch</p>
                  <Badge variant="outline" className="font-mono">
                    {versionInfo.branch}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Commits</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {versionInfo.commits.length}+ Commits
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Changelog */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Changelog
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versionInfo?.commits && versionInfo.commits.length > 0 ? (
              <div className="space-y-4">
                {versionInfo.commits.map((commit) => (
                  <div 
                    key={commit.hash} 
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          {commit.shortHash}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {commit.author}
                        </Badge>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {commit.message}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(commit.date).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Keine Commit-Historie verfügbar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}