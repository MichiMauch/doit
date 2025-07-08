"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  Package, 
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Sparkles
} from "lucide-react";
import { changelog, type ChangelogEntry } from "@/data/changelog";

const getTypeColor = (type: ChangelogEntry['type']) => {
  switch (type) {
    case 'major':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'minor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'patch':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getTypeIcon = (type: ChangelogEntry['type']) => {
  switch (type) {
    case 'major':
      return <Sparkles className="h-4 w-4" />;
    case 'minor':
      return <Zap className="h-4 w-4" />;
    case 'patch':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="border-gray-300 dark:border-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Detailed Changelog
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Vollständige Versionshistorie und Änderungen der DOIT Anwendung
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Current Version Highlight */}
        <Card className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-700 mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle className="text-primary-900 dark:text-primary-100">
                Aktuelle Version: v{changelog[0]?.version}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-primary-800 dark:text-primary-200 mb-4">
              Veröffentlicht am {new Date(changelog[0]?.date).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <div className="grid gap-2">
              {changelog[0]?.changes.slice(0, 3).map((change, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                  <span className="text-primary-800 dark:text-primary-200 text-sm">{change}</span>
                </div>
              ))}
              {changelog[0]?.changes.length > 3 && (
                <p className="text-primary-700 dark:text-primary-300 text-sm italic ml-6">
                  ...und {changelog[0].changes.length - 3} weitere Änderungen
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Complete Changelog */}
        <div className="space-y-6">
          {changelog.map((entry) => (
            <Card key={entry.version} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(entry.type)}
                    <CardTitle className="text-gray-900 dark:text-white">
                      Version {entry.version}
                    </CardTitle>
                    <Badge className={getTypeColor(entry.type)}>
                      {entry.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(entry.date).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entry.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <span className="text-gray-800 dark:text-gray-200">{change}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
            Über dieses Changelog
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p>• <strong>Major:</strong> Große neue Features oder breaking changes</p>
            <p>• <strong>Minor:</strong> Neue Features und Verbesserungen</p>
            <p>• <strong>Patch:</strong> Bugfixes und kleine Anpassungen</p>
          </div>
        </div>
      </div>
    </div>
  );
}