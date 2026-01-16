"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeTour } from "@/components/onboarding";
import { Play, RotateCcw } from "lucide-react";

export default function WelcomeTourDemoPage() {
  const [showTour, setShowTour] = useState(false);

  const handleComplete = () => {
    setShowTour(false);
  };

  const handleSkip = () => {
    setShowTour(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome Tour Demo</h1>
        <p className="text-muted-foreground">
          Preview the onboarding experience that new users see when they first use the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Tour</CardTitle>
          <CardDescription>
            A 3-step interactive tour that introduces key features: Upload, Organize, and Share.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Beautiful custom illustrations for each step</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Progress bar and dot navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Quick tips on each step</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Dismissible and only shows once</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Smooth animations and transitions</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => setShowTour(true)} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Preview Tour
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Tour Steps:</h3>
            <div className="grid gap-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    1
                  </div>
                  <h4 className="font-medium">Upload Your Files</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  Learn how to upload files with drag & drop, automatic thumbnails, and multi-file support.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    2
                  </div>
                  <h4 className="font-medium">Organize Everything</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  Discover folder organization, starring important items, and powerful search.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    3
                  </div>
                  <h4 className="font-medium">Share & Collaborate</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  Create secure share links with passwords, expiration dates, and download tracking.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Storage:</span>
            <span className="text-muted-foreground ml-2">
              localStorage key: <code className="px-1 py-0.5 bg-muted rounded">assets-man-welcome-tour-completed</code>
            </span>
          </div>
          <div>
            <span className="font-medium">Trigger:</span>
            <span className="text-muted-foreground ml-2">Automatically on first visit to /files</span>
          </div>
          <div>
            <span className="font-medium">Components:</span>
            <span className="text-muted-foreground ml-2">
              Built with shadcn Dialog, custom SVG illustrations, and responsive layout
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tour Component */}
      <WelcomeTour open={showTour} onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}
