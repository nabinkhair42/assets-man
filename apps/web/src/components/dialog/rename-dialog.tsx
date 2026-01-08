"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateFolder, useUpdateAsset } from "@/hooks";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import type { Folder, Asset } from "@/types";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Folder | Asset | null;
  itemType: "folder" | "asset";
}

export function RenameDialog({ open, onOpenChange, item, itemType }: RenameDialogProps) {
  const [name, setName] = useState("");
  const updateFolder = useUpdateFolder();
  const updateAsset = useUpdateAsset();

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

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
      }
    );
  };

  const isPending = updateFolder.isPending || updateAsset.isPending;
  const label = itemType === "folder" ? "Folder" : "File";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {label}</DialogTitle>
            <DialogDescription>Enter a new name.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
