"use client";

import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/responsive-alert-dialog";
import { Button } from "@/components/ui/button";
import { useEmptyTrash } from "@/hooks/use-trash";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

interface EmptyTrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmptyTrashDialog({
  open,
  onOpenChange,
}: EmptyTrashDialogProps) {
  const emptyTrash = useEmptyTrash();

  const handleEmptyTrash = () => {
    const toastId = toast.loading("Emptying trash");
    emptyTrash.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Deleted ${result.total} items permanently`, {
          id: toastId,
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error), { id: toastId });
      },
    });
  };

  return (
    <ResponsiveAlertDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>Empty Trash?</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            This will permanently delete all items in trash. This action cannot
            be undone.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            onClick={handleEmptyTrash}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {emptyTrash.isPending ? "Deleting..." : "Empty Trash"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}

// Trigger button for convenience
export function EmptyTrashTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onClick}
      tooltipContent="Permanently delete all items"
    >
      Empty Trash
    </Button>
  );
}
