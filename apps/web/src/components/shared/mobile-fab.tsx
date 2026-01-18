"use client";

import { useState } from "react";
import { Plus, FolderPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileFabProps {
  onUpload: () => void;
  onNewFolder: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export function MobileFab({
  onUpload,
  onNewFolder,
  disabled,
  hidden,
}: MobileFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="relative flex flex-col items-end gap-3">
        {/* Sub-actions */}
        <div
          className={cn(
            "flex flex-col items-end gap-3 transition-all duration-200",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {/* New Folder Action */}
          <div className="flex items-center gap-3">
            <span className="bg-card px-3 py-1.5 rounded-md text-sm font-medium shadow-lg whitespace-nowrap">
              New Folder
            </span>
            <Button
              size="icon"
              variant="secondary"
              className="h-11 w-11 rounded-full shadow-lg shrink-0"
              onClick={() => {
                onNewFolder();
                setIsOpen(false);
              }}
              disabled={disabled}
            >
              <FolderPlus className="h-5 w-5" />
              <span className="sr-only">New Folder</span>
            </Button>
          </div>

          {/* Upload Action */}
          <div className="flex items-center gap-3">
            <span className="bg-card px-3 py-1.5 rounded-md text-sm font-medium shadow-lg whitespace-nowrap">
              Upload
            </span>
            <Button
              size="icon"
              variant="secondary"
              className="h-11 w-11 rounded-full shadow-lg shrink-0"
              onClick={() => {
                onUpload();
                setIsOpen(false);
              }}
              disabled={disabled}
            >
              <Upload className="h-5 w-5" />
              <span className="sr-only">Upload</span>
            </Button>
          </div>
        </div>

        {/* Main FAB */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-transform duration-200",
            isOpen && "rotate-45 bg-muted text-muted-foreground hover:bg-muted",
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">{isOpen ? "Close" : "Add"}</span>
        </Button>
      </div>
    </div>
  );
}
