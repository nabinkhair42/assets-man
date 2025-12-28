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
import { Button } from "@/components/ui/button";
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

function getRelevanceLabel(score: number | undefined): string | null {
  if (score === undefined) return null;
  if (score >= 0.8) return "Best match";
  if (score >= 0.5) return "Good match";
  if (score >= 0.3) return "Partial match";
  return null;
}

function getRelevanceColor(score: number | undefined): string {
  if (score === undefined) return "";
  if (score >= 0.8) return "text-green-500";
  if (score >= 0.5) return "text-blue-500";
  if (score >= 0.3) return "text-amber-500";
  return "text-muted-foreground";
}

interface SearchCommandProps {
  onNavigateToFolder?: (folderId: string | null) => void;
}

export function SearchCommand({ onNavigateToFolder }: SearchCommandProps) {
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
    // Navigate to the folder containing the asset
    if (onNavigateToFolder) {
      onNavigateToFolder(asset.folderId);
    } else if (asset.folderId) {
      router.push(`/files?folderId=${asset.folderId}`);
    } else {
      router.push("/files");
    }
  }, [onNavigateToFolder, router]);

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
      <Button
        variant="outline"
        size="sm"
        className="relative h-8 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:w-64 md:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search files and folders...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search"
        description="Search for files and folders"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Type to search files and folders..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          ) : isLoading ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : assets.length === 0 && folders.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {folders.length > 0 && (
                <CommandGroup heading="Folders">
                  {folders.map((folder) => {
                    const relevanceLabel = getRelevanceLabel(folder.relevanceScore);
                    return (
                      <CommandItem
                        key={`folder-${folder.id}`}
                        value={`folder-${folder.name}`}
                        onSelect={() => handleSelectFolder(folder)}
                        className="cursor-pointer"
                      >
                        <FolderIcon className="mr-2 h-4 w-4 text-primary" />
                        <span className="flex-1 truncate">{folder.name}</span>
                        {relevanceLabel && (
                          <span className={cn("ml-2 text-xs", getRelevanceColor(folder.relevanceScore))}>
                            {relevanceLabel}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {folders.length > 0 && assets.length > 0 && <CommandSeparator />}
              {assets.length > 0 && (
                <CommandGroup heading="Files">
                  {assets.map((asset) => {
                    const { icon: Icon, color } = getFileIconData(asset.mimeType);
                    const relevanceLabel = getRelevanceLabel(asset.relevanceScore);
                    return (
                      <CommandItem
                        key={`asset-${asset.id}`}
                        value={`asset-${asset.name}`}
                        onSelect={() => handleSelectAsset(asset)}
                        className="cursor-pointer"
                      >
                        <Icon className={cn("mr-2 h-4 w-4", color)} />
                        <span className="flex-1 truncate">{asset.name}</span>
                        {relevanceLabel && (
                          <span className={cn("ml-2 text-xs", getRelevanceColor(asset.relevanceScore))}>
                            {relevanceLabel}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatFileSize(asset.size)}
                        </span>
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
