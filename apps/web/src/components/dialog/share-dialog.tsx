"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSharesForItem, useCreateUserShare, useCreateLinkShare, useDeleteShare } from "@/hooks";
import { shareService } from "@/services";
import { toast } from "sonner";
import { Copy, Link, Mail, Trash2, Users, Eye, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder, Asset, SharePermission, ShareWithDetails } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Folder | Asset | null;
  itemType: "folder" | "asset";
}

export function ShareDialog({ open, onOpenChange, item, itemType }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<"people" | "link">("people");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [linkPermission, setLinkPermission] = useState<SharePermission>("view");
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);

  const { data: shares = [], isLoading } = useSharesForItem(itemType, item?.id ?? "");
  const createUserShare = useCreateUserShare();
  const createLinkShare = useCreateLinkShare();
  const deleteShare = useDeleteShare();

  const userShares = shares.filter((s) => s.shareType === "user");
  const linkShares = shares.filter((s) => s.shareType === "link");

  const handleAddPerson = async () => {
    if (!item || !email.trim()) return;

    createUserShare.mutate(
      {
        [itemType === "folder" ? "folderId" : "assetId"]: item.id,
        email: email.trim(),
        permission,
      },
      {
        onSuccess: () => {
          toast.success(`Shared with ${email}`);
          setEmail("");
        },
        onError: () => {
          toast.error("Failed to share. Check the email address.");
        },
      }
    );
  };

  const handleCreateLink = async () => {
    if (!item) return;

    createLinkShare.mutate(
      {
        [itemType === "folder" ? "folderId" : "assetId"]: item.id,
        permission: linkPermission,
        password: hasPassword && password ? password : undefined,
        expiresIn: hasExpiry ? expiryHours : undefined,
      },
      {
        onSuccess: (share) => {
          const link = shareService.generateShareLink(share.linkToken ?? "");
          navigator.clipboard.writeText(link);
          toast.success("Link copied to clipboard!");
          setPassword("");
          setHasPassword(false);
        },
        onError: () => {
          toast.error("Failed to create share link");
        },
      }
    );
  };

  const handleCopyLink = (token: string) => {
    const link = shareService.generateShareLink(token);
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleRemoveShare = (shareId: string) => {
    deleteShare.mutate(shareId, {
      onSuccess: () => toast.success("Share removed"),
      onError: () => toast.error("Failed to remove share"),
    });
  };

  const isPending = createUserShare.isPending || createLinkShare.isPending || deleteShare.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share &quot;{item?.name}&quot;</DialogTitle>
          <DialogDescription>
            Share this {itemType} with others or create a public link.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "people" | "link")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people">
              <Users className="h-4 w-4 mr-2" />
              People
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                />
              </div>
              <Select value={permission} onValueChange={(v: string) => setPermission(v as SharePermission)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      View
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddPerson} disabled={isPending || !email.trim()}>
                {createUserShare.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>

            <ScrollArea className="h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : userShares.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one has access yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userShares.map((share) => (
                    <ShareItem
                      key={share.id}
                      share={share}
                      onRemove={() => handleRemoveShare(share.id)}
                      isPending={deleteShare.isPending}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permission</Label>
                <Select value={linkPermission} onValueChange={(v: string) => setLinkPermission(v as SharePermission)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="password-toggle">Require password</Label>
                <Switch
                  id="password-toggle"
                  checked={hasPassword}
                  onCheckedChange={setHasPassword}
                />
              </div>

              {hasPassword && (
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="expiry-toggle">Set expiration</Label>
                <Switch
                  id="expiry-toggle"
                  checked={hasExpiry}
                  onCheckedChange={setHasExpiry}
                />
              </div>

              {hasExpiry && (
                <Select value={expiryHours.toString()} onValueChange={(v: string) => setExpiryHours(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button className="w-full" onClick={handleCreateLink} disabled={isPending}>
                {createLinkShare.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Create Link
              </Button>
            </div>

            {linkShares.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Active Links</p>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {linkShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Link className="h-4 w-4" />
                          <span className="text-muted-foreground">
                            {share.permission === "edit" ? "Can edit" : "Can view"}
                          </span>
                          {share.expiresAt && (
                            <span className="text-xs text-muted-foreground">
                              Expires {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCopyLink(share.linkToken ?? "")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ShareItemProps {
  share: ShareWithDetails;
  onRemove: () => void;
  isPending?: boolean;
}

function ShareItem({ share, onRemove, isPending }: ShareItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {(share.sharedWithName ?? share.sharedWithEmail ?? "?")[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{share.sharedWithName ?? share.sharedWithEmail}</p>
          <p className="text-xs text-muted-foreground">
            {share.permission === "edit" ? "Can edit" : "Can view"}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={isPending}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
