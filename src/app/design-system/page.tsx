"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Download,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

export default function DesignSystemPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedItems((prev) => ({ ...prev, [id]: checked }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Theme Toggle */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Design System
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Alle UI-Komponenten und Designelemente der DOIT Anwendung
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Logo Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <img
                  src="/doit-logo.png"
                  alt="DOIT Logo"
                  className="h-16 w-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Big (h-16)
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/doit-logo.png"
                  alt="DOIT Logo"
                  className="h-12 w-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Standard (h-12)
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/doit-logo.png"
                  alt="DOIT Logo"
                  className="h-8 w-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Header (h-8)
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/doit-logo.png"
                  alt="DOIT Logo"
                  className="h-6 w-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Small (h-6)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colors */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Farben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Primary Colors
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className={`w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-primary-${shade}`}
                        />
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {shade}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Success Colors */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Success Colors
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className={`w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-success-${shade}`}
                        />
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {shade}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Warning Colors */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Warning Colors
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className={`w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-warning-${shade}`}
                        />
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {shade}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Danger Colors */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Danger Colors
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className={`w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-danger-${shade}`}
                        />
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          {shade}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Typografie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <img
                  src="/doit-logo.png"
                  alt="DOIT Logo"
                  className="h-16 w-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  App Title - Logo
                </p>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Heading 1
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  text-3xl font-bold
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Heading 2
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  text-2xl font-semibold
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  Heading 3
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  text-xl font-medium
                </p>
              </div>
              <div>
                <p className="text-base text-gray-900 dark:text-gray-100">
                  Body Text
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  text-base
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Small Text
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  text-sm
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Buttons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Primary Buttons
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Secondary Buttons
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm">
                    Small Outline
                  </Button>
                  <Button variant="outline">Default Outline</Button>
                  <Button variant="outline" size="lg">
                    Large Outline
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Ghost Buttons
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="ghost" size="sm">
                    Small Ghost
                  </Button>
                  <Button variant="ghost">Default Ghost</Button>
                  <Button variant="ghost" size="lg">
                    Large Ghost
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Icon Buttons
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Mit Icon
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button variant="ghost">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Form Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-900 dark:text-gray-100"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Deine E-Mail eingeben"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="message"
                  className="text-gray-900 dark:text-gray-100"
                >
                  Nachricht
                </Label>
                <Textarea id="message" placeholder="Deine Nachricht hier..." />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Checkboxes
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={checkedItems.terms || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("terms", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="terms"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Akzeptiere die Nutzungsbedingungen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={checkedItems.newsletter || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("newsletter", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="newsletter"
                      className="text-gray-900 dark:text-gray-100"
                    >
                      Newsletter abonnieren
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Default Badges
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Status Badges
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Erledigt
                  </Badge>
                  <Badge className="bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200">
                    <Clock className="h-3 w-3 mr-1" />
                    In Bearbeitung
                  </Badge>
                  <Badge className="bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Überfällig
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dropdowns */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Dropdowns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Actions Menu
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Aktionen
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Herunterladen
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Priority Menu
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <Star className="h-4 w-4 mr-2" />
                      Priorität
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <div className="w-3 h-3 rounded-full bg-danger-500 mr-2"></div>
                      Hoch
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="w-3 h-3 rounded-full bg-warning-500 mr-2"></div>
                      Mittel
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="w-3 h-3 rounded-full bg-success-500 mr-2"></div>
                      Niedrig
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Basic Card
                </h3>
                <Card className="p-4 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Card Title
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Dies ist ein Beispiel für eine Karte mit Dark Mode Support.
                  </p>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Todo Card Example
                </h3>
                <Card className="p-4 bg-gradient-to-r from-primary-200/30 to-white dark:from-primary-900/20 dark:to-gray-800 border-l-4 border-l-primary-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Meeting vorbereiten
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Heute, 14:00
                      </p>
                    </div>
                    <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      Hoch
                    </Badge>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
