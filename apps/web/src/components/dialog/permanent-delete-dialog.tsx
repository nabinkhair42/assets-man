"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermanentlyDelete } from "@/hooks";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { TrashedItem } from "@/types";

interface PermanentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TrashedItem | null;
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  item,
}: PermanentDeleteDialogProps) {
  const permanentlyDelete = usePermanentlyDelete();

  const handleDelete = () => {
    if (!item) return;

    const toastId = toast.loading(`Deleting ${item.name} permanently`);
    permanentlyDelete.mutate(
      { id: item.id, type: item.itemType },
      {
        onSuccess: () => {
          toast.success(`${item.name} permanently deleted`, { id: toastId });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error), { id: toastId });
        },
      }
    );
  };

  const isFolder = item?.itemType === "folder";
  const label = isFolder ? "folder" : "file";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete &quot;{item?.name}&quot;?
            {isFolder && " This will also delete all files inside."}
            <span className="block mt-2 font-medium text-destructive">
              This action cannot be undone. The {label} will be permanently removed.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={permanentlyDelete.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {permanentlyDelete.isPending ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
