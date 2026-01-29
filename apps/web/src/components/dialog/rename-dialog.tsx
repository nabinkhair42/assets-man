"use client";

import { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateFolder } from "@/hooks/use-folders";
import { useUpdateAsset } from "@/hooks/use-assets";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { Folder } from "@/types/folder";
import type { Asset } from "@/types/asset";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Folder | Asset | null;
  itemType: "folder" | "asset";
}

export function RenameDialog({
  open,
  onOpenChange,
  item,
  itemType,
}: RenameDialogProps) {
  const [name, setName] = useState("");
  const [prevItem, setPrevItem] = useState(item);
  const updateFolder = useUpdateFolder();
  const updateAsset = useUpdateAsset();

  // Reset name when item changes (React recommended pattern for adjusting state during render)
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setName(item.name);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !item) return;

    const mutation = itemType === "folder" ? updateFolder : updateAsset;
    const label = itemType === "folder" ? "Folder" : "File";

    mutation.mutate(
      { id: item.id, input: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success(label + " renamed");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const isPending = updateFolder.isPending || updateAsset.isPending;
  const label = itemType === "folder" ? "Folder" : "File";

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <form onSubmit={handleSubmit}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Rename {label}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Enter a new name.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="py-4">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
