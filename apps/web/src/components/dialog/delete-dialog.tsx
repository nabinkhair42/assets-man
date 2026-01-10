"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteFolder, useDeleteAsset } from "@/hooks";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { Folder, Asset } from "@/types";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Folder | Asset | null;
  itemType: "folder" | "asset";
}

export function DeleteDialog({ open, onOpenChange, item, itemType }: DeleteDialogProps) {
  const deleteFolder = useDeleteFolder();
  const deleteAsset = useDeleteAsset();

  const handleDelete = () => {
    if (!item) return;

    const mutation = itemType === "folder" ? deleteFolder : deleteAsset;
    const label = itemType === "folder" ? "Folder" : "File";

    mutation.mutate(item.id, {
      onSuccess: () => {
        toast.success(label + " deleted");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const isPending = deleteFolder.isPending || deleteAsset.isPending;
  const label = itemType === "folder" ? "Folder" : "File";
  const extraWarning = itemType === "folder" ? " This will also delete all files inside." : "";

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Delete {label}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Are you sure you want to delete &quot;{item?.name}&quot;?
            {extraWarning} This action cannot be undone.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
