"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface FileActionsContextType {
  triggerUpload: () => void;
  triggerCreateFolder: () => void;
  registerUploadTrigger: (trigger: () => void) => void;
  registerCreateFolderTrigger: (trigger: () => void) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const FileActionsContext = createContext<FileActionsContextType | null>(null);

export function FileActionsProvider({ children }: { children: ReactNode }) {
  const uploadTriggerRef = useRef<(() => void) | null>(null);
  const createFolderTriggerRef = useRef<(() => void) | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const triggerUpload = useCallback(() => {
    uploadTriggerRef.current?.();
  }, []);

  const triggerCreateFolder = useCallback(() => {
    createFolderTriggerRef.current?.();
  }, []);

  const registerUploadTrigger = useCallback((trigger: () => void) => {
    uploadTriggerRef.current = trigger;
  }, []);

  const registerCreateFolderTrigger = useCallback((trigger: () => void) => {
    createFolderTriggerRef.current = trigger;
  }, []);

  const value = useMemo(
    () => ({
      triggerUpload,
      triggerCreateFolder,
      registerUploadTrigger,
      registerCreateFolderTrigger,
      isUploading,
      setIsUploading,
    }),
    [isUploading, triggerUpload, triggerCreateFolder, registerUploadTrigger, registerCreateFolderTrigger]
  );

  return (
    <FileActionsContext.Provider value={value}>
      {children}
    </FileActionsContext.Provider>
  );
}

export function useFileActions() {
  const context = useContext(FileActionsContext);
  if (!context) {
    throw new Error("useFileActions must be used within a FileActionsProvider");
  }
  return context;
}
