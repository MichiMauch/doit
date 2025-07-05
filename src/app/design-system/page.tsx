"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Star, 
  Heart, 
  Download,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

export default function DesignSystemPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Design System</h1>
          <p className="text-lg text-gray-600">
            Alle UI-Komponenten und Designelemente der DOIT Anwendung
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colors */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Farben</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Primary Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg border border-gray-200 bg-primary-${shade}`}
                      />
                      <div className="text-xs mt-1 text-gray-600">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Success Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg border border-gray-200 bg-success-${shade}`}
                      />
                      <div className="text-xs mt-1 text-gray-600">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Warning Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg border border-gray-200 bg-warning-${shade}`}
                      />
                      <div className="text-xs mt-1 text-gray-600">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Danger Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg border border-gray-200 bg-danger-${shade}`}
                      />
                      <div className="text-xs mt-1 text-gray-600">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Gray Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg border border-gray-200 bg-gray-${shade}`}
                      />
                      <div className="text-xs mt-1 text-gray-600">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Typografie</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-6xl font-bold text-gray-900 font-audiowide tracking-wider">DOIT</h1>
                <p className="text-sm text-gray-500">App Title - Audiowide font</p>
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900 font-red-hat-display">Red Hat Display</h1>
                <p className="text-sm text-gray-500">Main Font - Red Hat Display</p>
              </div>
              <div>
                <h1 className="text-6xl font-bold text-gray-900">Heading 1</h1>
                <p className="text-sm text-gray-500">text-6xl font-bold - Red Hat Display</p>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900">Heading 2</h2>
                <p className="text-sm text-gray-500">text-4xl font-bold</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Heading 3</h3>
                <p className="text-sm text-gray-500">text-2xl font-semibold</p>
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-900">Heading 4</h4>
                <p className="text-sm text-gray-500">text-xl font-medium</p>
              </div>
              <div>
                <p className="text-base text-gray-800">
                  Body Text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-gray-500">text-base</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Small Text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-gray-500">text-sm</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Extra Small Text - Lorem ipsum dolor sit amet.
                </p>
                <p className="text-sm text-gray-500">text-xs</p>
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Primary Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" className="bg-primary-400 hover:bg-primary-500">
                    Small
                  </Button>
                  <Button className="bg-primary-400 hover:bg-primary-500">
                    Medium
                  </Button>
                  <Button size="lg" className="bg-primary-400 hover:bg-primary-500">
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Secondary Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm">
                    Small
                  </Button>
                  <Button variant="secondary">
                    Medium
                  </Button>
                  <Button variant="secondary" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Outline Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    Small
                  </Button>
                  <Button variant="outline">
                    Medium
                  </Button>
                  <Button variant="outline" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Ghost Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" size="sm">
                    Small
                  </Button>
                  <Button variant="ghost">
                    Medium
                  </Button>
                  <Button variant="ghost" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Buttons with Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-primary-400 hover:bg-primary-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="text-danger-600 border-danger-300 hover:bg-danger-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Badges */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Badges</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary-100 text-primary-800">Primary</Badge>
                  <Badge className="bg-success-100 text-success-800">Success</Badge>
                  <Badge className="bg-warning-100 text-warning-800">Warning</Badge>
                  <Badge className="bg-danger-100 text-danger-800">Danger</Badge>
                  <Badge className="bg-gray-100 text-gray-800">Gray</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Task Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gray-100 text-gray-800">
                    <Clock className="h-3 w-3 mr-1" />
                    To Do
                  </Badge>
                  <Badge className="bg-warning-100 text-warning-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                  <Badge className="bg-success-100 text-success-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Elements */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="input-default">Default Input</Label>
                <Input 
                  id="input-default"
                  placeholder="Enter some text..." 
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="input-error">Error Input</Label>
                <Input 
                  id="input-error"
                  placeholder="This has an error..." 
                  className="mt-1 border-danger-400 focus:border-danger-400 focus:ring-danger-100"
                />
              </div>

              <div>
                <Label htmlFor="input-success">Success Input</Label>
                <Input 
                  id="input-success"
                  placeholder="This is valid..." 
                  className="mt-1 border-success-400 focus:border-success-400 focus:ring-success-100"
                />
              </div>

              <div className="space-y-2">
                <Label>Checkboxes</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="checkbox-1"
                      checked={checkedItems["checkbox-1"] || false}
                      onCheckedChange={(checked) => handleCheckboxChange("checkbox-1", checked as boolean)}
                    />
                    <Label htmlFor="checkbox-1" className="text-sm">
                      Option 1
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="checkbox-2"
                      checked={checkedItems["checkbox-2"] || false}
                      onCheckedChange={(checked) => handleCheckboxChange("checkbox-2", checked as boolean)}
                    />
                    <Label htmlFor="checkbox-2" className="text-sm">
                      Option 2
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="checkbox-3"
                      checked={checkedItems["checkbox-3"] || false}
                      onCheckedChange={(checked) => handleCheckboxChange("checkbox-3", checked as boolean)}
                    />
                    <Label htmlFor="checkbox-3" className="text-sm">
                      Option 3
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Cards */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Cards</h2>
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Default Card</h3>
                <p className="text-sm text-gray-600">
                  This is a default card with some content inside.
                </p>
              </Card>

              <Card className="p-4 border-primary-200 bg-primary-50">
                <h3 className="font-medium mb-2 text-primary-800">Primary Card</h3>
                <p className="text-sm text-primary-700">
                  This is a primary styled card.
                </p>
              </Card>

              <Card className="p-4 border-success-200 bg-success-50">
                <h3 className="font-medium mb-2 text-success-800">Success Card</h3>
                <p className="text-sm text-success-700">
                  This is a success styled card.
                </p>
              </Card>

              <Card className="p-4 border-warning-200 bg-warning-50">
                <h3 className="font-medium mb-2 text-warning-800">Warning Card</h3>
                <p className="text-sm text-warning-700">
                  This is a warning styled card.
                </p>
              </Card>

              <Card className="p-4 border-danger-200 bg-danger-50">
                <h3 className="font-medium mb-2 text-danger-800">Danger Card</h3>
                <p className="text-sm text-danger-700">
                  This is a danger styled card.
                </p>
              </Card>
            </div>
          </Card>

          {/* Icons */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Icons</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Common Icons</h3>
                <div className="grid grid-cols-8 gap-4">
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 mx-auto text-success-600" />
                    <p className="text-xs mt-1">CheckCircle</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-6 w-6 mx-auto text-warning-600" />
                    <p className="text-xs mt-1">Clock</p>
                  </div>
                  <div className="text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-danger-600" />
                    <p className="text-xs mt-1">AlertCircle</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-6 w-6 mx-auto text-primary-600" />
                    <p className="text-xs mt-1">Star</p>
                  </div>
                  <div className="text-center">
                    <Heart className="h-6 w-6 mx-auto text-danger-600" />
                    <p className="text-xs mt-1">Heart</p>
                  </div>
                  <div className="text-center">
                    <Download className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs mt-1">Download</p>
                  </div>
                  <div className="text-center">
                    <Plus className="h-6 w-6 mx-auto text-primary-600" />
                    <p className="text-xs mt-1">Plus</p>
                  </div>
                  <div className="text-center">
                    <Edit className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs mt-1">Edit</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Shadows */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Shadows</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm font-medium">Small Shadow</p>
                <p className="text-xs text-gray-500">shadow-sm</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-md">
                <p className="text-sm font-medium">Medium Shadow</p>
                <p className="text-xs text-gray-500">shadow-md</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-lg">
                <p className="text-sm font-medium">Large Shadow</p>
                <p className="text-xs text-gray-500">shadow-lg</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-xl">
                <p className="text-sm font-medium">Extra Large Shadow</p>
                <p className="text-xs text-gray-500">shadow-xl</p>
              </div>
            </div>
          </Card>

          {/* Spacing */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Spacing</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-primary-400 rounded"></div>
                <span className="text-sm">4px - xs</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-4 bg-primary-400 rounded"></div>
                <span className="text-sm">8px - sm</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-4 bg-primary-400 rounded"></div>
                <span className="text-sm">16px - md</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-4 bg-primary-400 rounded"></div>
                <span className="text-sm">24px - lg</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-4 bg-primary-400 rounded"></div>
                <span className="text-sm">32px - xl</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-primary-300 text-primary-600 hover:bg-primary-50"
          >
            ← Zurück zur Hauptseite
          </Button>
        </div>
      </div>
    </div>
  );
}