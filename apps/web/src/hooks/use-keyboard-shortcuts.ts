"use client";

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

// Normalize key codes
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

// Check if the event target is an input element
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  // Check for contenteditable
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input field
      if (isInputElement(event.target)) return;

      const key = normalizeKey(event.key);

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const matchesKey = normalizeKey(shortcut.key) === key;
        const matchesCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

        // For ctrl shortcuts, allow both Ctrl and Cmd (meta) on Mac
        const ctrlOrMeta = shortcut.ctrl && (event.ctrlKey || event.metaKey);

        if (matchesKey && (shortcut.ctrl ? ctrlOrMeta : matchesCtrl) && matchesShift && matchesAlt) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

// Standard file browser shortcuts
export interface FileBrowserShortcutActions {
  onNewFolder?: () => void;
  onUpload?: () => void;
  onSelectAll?: () => void;
  onDownload?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onRefresh?: () => void;
  onEscape?: () => void;
  onPreview?: () => void;
}

export function useFileBrowserShortcuts(
  actions: FileBrowserShortcutActions,
  options: { enabled?: boolean; hasSelection?: boolean } = {}
) {
  const { enabled = true, hasSelection = false } = options;

  const shortcuts: KeyboardShortcut[] = [
    // Global shortcuts (always available)
    {
      key: "n",
      alt: true,
      action: () => actions.onNewFolder?.(),
      description: "New folder",
      enabled: !!actions.onNewFolder,
    },
    {
      key: "u",
      ctrl: true,
      action: () => actions.onUpload?.(),
      description: "Upload files",
      enabled: !!actions.onUpload,
    },
    {
      key: "a",
      ctrl: true,
      action: () => actions.onSelectAll?.(),
      description: "Select all",
      enabled: !!actions.onSelectAll,
    },
    {
      key: "F5",
      action: () => actions.onRefresh?.(),
      description: "Refresh",
      enabled: !!actions.onRefresh,
    },
    {
      key: "Escape",
      action: () => actions.onEscape?.(),
      description: "Clear selection",
      enabled: !!actions.onEscape,
    },

    // Selection-dependent shortcuts
    {
      key: "d",
      ctrl: true,
      action: () => actions.onDownload?.(),
      description: "Download",
      enabled: hasSelection && !!actions.onDownload,
    },
    {
      key: "s",
      ctrl: true,
      action: () => actions.onStar?.(),
      description: "Star/Unstar",
      enabled: hasSelection && !!actions.onStar,
    },
    {
      key: "F2",
      action: () => actions.onRename?.(),
      description: "Rename",
      enabled: hasSelection && !!actions.onRename,
    },
    {
      key: "Delete",
      action: () => actions.onDelete?.(),
      description: "Move to trash",
      enabled: hasSelection && !!actions.onDelete,
    },
    {
      key: "Backspace",
      action: () => actions.onDelete?.(),
      description: "Move to trash",
      enabled: hasSelection && !!actions.onDelete,
    },
    {
      key: "m",
      ctrl: true,
      action: () => actions.onMove?.(),
      description: "Move to",
      enabled: hasSelection && !!actions.onMove,
    },
    {
      key: "c",
      ctrl: true,
      action: () => actions.onCopy?.(),
      description: "Copy to",
      enabled: hasSelection && !!actions.onCopy,
    },
    {
      key: "Enter",
      action: () => actions.onPreview?.(),
      description: "Preview/Open",
      enabled: hasSelection && !!actions.onPreview,
    },
  ];

  useKeyboardShortcuts({ shortcuts, enabled });
}

// Get formatted shortcut key for display
export function formatShortcut(shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    // Use Cmd on Mac, Ctrl on Windows/Linux
    const isMac = typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac");
    parts.push(isMac ? "⌘" : "Ctrl");
  }

  if (shortcut.alt) {
    const isMac = typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac");
    parts.push(isMac ? "⌥" : "Alt");
  }

  if (shortcut.shift) {
    parts.push("Shift");
  }

  // Format special keys
  let keyLabel = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case "delete":
      keyLabel = "Del";
      break;
    case "backspace":
      keyLabel = "⌫";
      break;
    case "escape":
      keyLabel = "Esc";
      break;
    case "enter":
      keyLabel = "↵";
      break;
    default:
      keyLabel = shortcut.key.toUpperCase();
  }

  parts.push(keyLabel);

  return parts.join("+");
}

// Shortcut definitions for reference
export const SHORTCUT_DEFINITIONS = {
  newFolder: { key: "n", alt: true, description: "New folder" },
  upload: { key: "u", ctrl: true, description: "Upload files" },
  selectAll: { key: "a", ctrl: true, description: "Select all" },
  download: { key: "d", ctrl: true, description: "Download" },
  star: { key: "s", ctrl: true, description: "Star/Unstar" },
  rename: { key: "F2", description: "Rename" },
  delete: { key: "Delete", description: "Move to trash" },
  move: { key: "m", ctrl: true, description: "Move to" },
  copy: { key: "c", ctrl: true, description: "Copy to" },
  refresh: { key: "F5", description: "Refresh" },
  escape: { key: "Escape", description: "Clear selection" },
  preview: { key: "Enter", description: "Preview/Open" },
} as const;
