"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

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

  const triggerUpload = () => {
    uploadTriggerRef.current?.();
  };

  const triggerCreateFolder = () => {
    createFolderTriggerRef.current?.();
  };

  const registerUploadTrigger = (trigger: () => void) => {
    uploadTriggerRef.current = trigger;
  };

  const registerCreateFolderTrigger = (trigger: () => void) => {
    createFolderTriggerRef.current = trigger;
  };

  return (
    <FileActionsContext.Provider
      value={{
        triggerUpload,
        triggerCreateFolder,
        registerUploadTrigger,
        registerCreateFolderTrigger,
        isUploading,
        setIsUploading,
      }}
    >
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
