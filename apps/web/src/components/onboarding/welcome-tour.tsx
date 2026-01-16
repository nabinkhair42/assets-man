"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Upload, FolderTree, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadIllustration, OrganizeIllustration, ShareIllustration } from "./tour-illustrations";

interface WelcomeTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    title: "Upload Your Files",
    description: "Drag and drop files or click to browse. Support for all file types with automatic thumbnail generation for images and videos.",
    illustration: UploadIllustration,
    icon: Upload,
    tips: ["Drag & drop multiple files at once", "Create folders to stay organized", "Files are encrypted during upload"],
  },
  {
    title: "Organize Everything",
    description: "Create folders, move files around, and keep everything structured. Use stars to mark important items for quick access.",
    illustration: OrganizeIllustration,
    icon: FolderTree,
    tips: ["Nested folders supported", "Star important files", "Search across all your files"],
  },
  {
    title: "Share & Collaborate",
    description: "Generate secure share links with optional passwords and expiration dates. Track who accessed your files and when.",
    illustration: ShareIllustration,
    icon: Share2,
    tips: ["Set expiration dates", "Password protect shares", "Track downloads"],
  },
];

export function WelcomeTour({ open, onComplete, onSkip }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const step = tourSteps[currentStep];
  const Illustration = step.illustration;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden sm:max-h-[90vh]" showCloseButton={false}>
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl font-semibold truncate">Welcome to Assets Man</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-none">
          {/* Illustration */}
          <div className="mb-4 sm:mb-6 relative">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-3xl" />
            <div className="relative h-32 sm:h-48 flex items-center justify-center">
              <Illustration className="w-48 h-32 sm:w-64 sm:h-48 animate-fade-in" />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-semibold">{step.title}</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Quick tips:</p>
            {step.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-muted/30 gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <div className="flex gap-1 sm:gap-1.5">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all",
                  index === currentStep
                    ? "w-6 sm:w-8 bg-primary"
                    : "w-1.5 sm:w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <Button 
            onClick={handleNext} 
            className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4"
          >
            {isLastStep ? (
              "Get Started"
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
