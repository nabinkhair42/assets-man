"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";
import { formatShortcut } from "@/hooks";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: "General",
    shortcuts: [
      { key: "n", alt: true, description: "New folder" },
      { key: "u", ctrl: true, description: "Upload files" },
      { key: "a", ctrl: true, description: "Select all" },
      { key: "F5", description: "Refresh" },
      { key: "Escape", description: "Clear selection" },
    ],
  },
  {
    title: "File Operations",
    shortcuts: [
      { key: "d", ctrl: true, description: "Download selected" },
      { key: "s", ctrl: true, description: "Star/Unstar" },
      { key: "F2", description: "Rename" },
      { key: "m", ctrl: true, description: "Move to" },
      { key: "c", ctrl: true, description: "Copy to" },
      { key: "Delete", description: "Move to trash" },
      { key: "Enter", description: "Preview/Open" },
    ],
  },
  {
    title: "Trash",
    shortcuts: [
      { key: "r", ctrl: true, description: "Restore selected" },
      { key: "Delete", description: "Permanently delete" },
    ],
  },
];

function ShortcutBadge({ shortcut }: { shortcut: ShortcutItem }) {
  const formatted = formatShortcut(shortcut);
  const parts = formatted.split("+");

  return (
    <div className="flex items-center gap-1">
      {parts.map((part, i) => (
        <kbd
          key={i}
          className="px-2 py-1 text-xs font-medium bg-muted border border-border rounded-md shadow-sm min-w-6 text-center"
        >
          {part}
        </kbd>
      ))}
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Keyboard Shortcuts</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="space-y-6 pb-2">
            {shortcutCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <ShortcutBadge shortcut={shortcut} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
