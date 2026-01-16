"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  Folder as FolderIcon,
  Search,
} from "lucide-react";
import { assetService, folderService } from "@/services";
import type { Asset, Folder } from "@/types";
import { cn } from "@/lib/utils";

function getFileIconData(mimeType: string) {
  if (mimeType?.startsWith("image/")) return { icon: FileImage, color: "text-pink-500" };
  if (mimeType?.startsWith("video/")) return { icon: FileVideo, color: "text-purple-500" };
  if (mimeType?.startsWith("audio/")) return { icon: FileAudio, color: "text-orange-500" };
  if (mimeType?.includes("pdf") || mimeType?.includes("document") || mimeType?.includes("text"))
    return { icon: FileText, color: "text-blue-500" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("archive"))
    return { icon: FileArchive, color: "text-amber-500" };
  return { icon: File, color: "text-muted-foreground" };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface SearchCommandProps {
  onNavigateToFolder?: (folderId: string | null) => void;
  onPreviewAsset?: (asset: Asset) => void;
}

export function SearchCommand({ onNavigateToFolder, onPreviewAsset }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setAssets([]);
      setFolders([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [assetResults, folderResults] = await Promise.all([
          assetService.search(query, 5),
          folderService.search(query, 5),
        ]);
        setAssets(assetResults);
        setFolders(folderResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelectFolder = useCallback((folder: Folder) => {
    setOpen(false);
    setQuery("");
    if (onNavigateToFolder) {
      onNavigateToFolder(folder.id);
    } else {
      router.push(`/files?folderId=${folder.id}`);
    }
  }, [onNavigateToFolder, router]);

  const handleSelectAsset = useCallback((asset: Asset) => {
    setOpen(false);
    setQuery("");
    if (onPreviewAsset) {
      onPreviewAsset(asset);
    } else if (onNavigateToFolder) {
      onNavigateToFolder(asset.folderId);
    } else if (asset.folderId) {
      router.push(`/files?folderId=${asset.folderId}`);
    } else {
      router.push("/files");
    }
  }, [onNavigateToFolder, onPreviewAsset, router]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setQuery("");
      setAssets([]);
      setFolders([]);
    }
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group flex items-center gap-2 h-9 w-full max-w-md px-3",
          "rounded-lg border border-border/50 bg-muted/30",
          "text-sm text-muted-foreground",
          "transition-all duration-200",
          "hover:bg-muted/50 hover:border-border",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        )}
      >
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <span className="flex-1 text-left truncate">
          <span className="hidden md:inline">Search files and folders...</span>
          <span className="md:hidden">Search...</span>
        </span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search"
        description="Search for files and folders"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search files and folders..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <div className="py-14 text-center">
              <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Type to search your files</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Enter at least 2 characters</p>
            </div>
          ) : isLoading ? (
            <div className="py-14 text-center">
              <div className="h-6 w-6 mx-auto mb-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : assets.length === 0 && folders.length === 0 ? (
            <CommandEmpty>
              <div className="py-10 px-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground">
                      Try searching with different keywords or check your spelling
                    </p>
                  </div>
                </div>
              </div>
            </CommandEmpty>
          ) : (
            <>
              {folders.length > 0 && (
                <CommandGroup heading="Folders">
                  {folders.map((folder) => (
                    <CommandItem
                      key={`folder-${folder.id}`}
                      value={`folder-${folder.name}`}
                      onSelect={() => handleSelectFolder(folder)}
                      className="cursor-pointer gap-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <FolderIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="flex-1 truncate font-medium">{folder.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {folders.length > 0 && assets.length > 0 && <CommandSeparator />}
              {assets.length > 0 && (
                <CommandGroup heading="Files">
                  {assets.map((asset) => {
                    const { icon: Icon, color } = getFileIconData(asset.mimeType);
                    return (
                      <CommandItem
                        key={`asset-${asset.id}`}
                        value={`asset-${asset.name}`}
                        onSelect={() => handleSelectAsset(asset)}
                        className="cursor-pointer gap-3 py-2.5"
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted")}>
                          <Icon className={cn("h-4 w-4", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
