"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useEmptyTrash } from "@/hooks";
import { toast } from "sonner";

interface EmptyTrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmptyTrashDialog({ open, onOpenChange }: EmptyTrashDialogProps) {
  const emptyTrash = useEmptyTrash();

  const handleEmptyTrash = () => {
    const toastId = toast.loading("Emptying trash");
    emptyTrash.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Deleted ${result.total} items permanently`, { id: toastId });
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to empty trash", { id: toastId });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all items in trash. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEmptyTrash}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {emptyTrash.isPending ? "Deleting..." : "Empty Trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Trigger button for convenience
export function EmptyTrashTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="destructive" size="sm" onClick={onClick} tooltipContent="Permanently delete all items">
      Empty Trash
    </Button>
  );
}
