"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeleteFolder, useDeleteAsset } from "@/hooks";
import { toast } from "sonner";
import type { SelectedItem } from "@/components/shared";
import { File, Folder } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SelectedItem[];
  onSuccess?: () => void;
}

export function BulkDeleteDialog({ open, onOpenChange, items, onSuccess }: BulkDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteFolder = useDeleteFolder();
  const deleteAsset = useDeleteAsset();

  const folderCount = items.filter((i) => i.type === "folder").length;
  const assetCount = items.filter((i) => i.type === "asset").length;

  const handleDelete = async () => {
    if (items.length === 0) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Deleting ${items.length} items...`);

    for (const item of items) {
      try {
        if (item.type === "folder") {
          await new Promise<void>((resolve, reject) => {
            deleteFolder.mutate(item.id, {
              onSuccess: () => resolve(),
              onError: () => reject(),
            });
          });
        } else {
          await new Promise<void>((resolve, reject) => {
            deleteAsset.mutate(item.id, {
              onSuccess: () => resolve(),
              onError: () => reject(),
            });
          });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsDeleting(false);

    if (failCount === 0) {
      toast.success(`Deleted ${successCount} items`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Failed to delete items`, { id: toastId });
    } else {
      toast.warning(`Deleted ${successCount} items, ${failCount} failed`, { id: toastId });
    }

    onOpenChange(false);
    onSuccess?.();
  };

  // Single item - simplified UI like regular DeleteDialog
  if (items.length === 1) {
    const item = items[0]!;
    const label = item.type === "folder" ? "Folder" : "File";
    const extraWarning = item.type === "folder" ? " This will also delete all files inside." : "";

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {label}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{item.name}&quot;?
              {extraWarning} This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Multiple items - show list
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Delete {items.length} Items
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete these items? This action cannot be undone.
            {folderCount > 0 && (
              <span className="block mt-1 text-amber-600">
                Warning: Deleting folders will also delete all files inside them.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[200px] border rounded-md p-2">
          <div className="space-y-1">
            {items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                {item.type === "folder" ? (
                  <Folder className="h-4 w-4 text-blue-500" />
                ) : (
                  <File className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          {folderCount > 0 && <span>{folderCount} folder{folderCount !== 1 ? "s" : ""}</span>}
          {folderCount > 0 && assetCount > 0 && <span> and </span>}
          {assetCount > 0 && <span>{assetCount} file{assetCount !== 1 ? "s" : ""}</span>}
          <span> will be permanently deleted.</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
