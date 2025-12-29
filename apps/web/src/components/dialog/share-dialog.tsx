"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Copy,
  Link,
  Mail,
  Trash2,
  Users,
  Eye,
  Pencil,
  Loader2,
  Folder,
  FileText,
  Lock,
  Clock,
  Check,
  Globe,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder as FolderType, Asset, SharePermission, ShareWithDetails } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FolderType | Asset | null;
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
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>Share {item?.name}</DialogTitle>
          <DialogDescription>Share this {itemType} with others</DialogDescription>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 bg-muted/30">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              itemType === "folder" ? "bg-primary/10" : "bg-blue-500/10"
            )}>
              {itemType === "folder" ? (
                <Folder className="h-6 w-6 text-primary" />
              ) : (
                <FileText className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate pr-8">
                Share &quot;{item?.name}&quot;
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {userShares.length > 0 || linkShares.length > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {userShares.length} {userShares.length === 1 ? "person" : "people"}
                    {linkShares.length > 0 && (
                      <>
                        <span className="text-border">•</span>
                        <Link className="h-3.5 w-3.5" />
                        {linkShares.length} {linkShares.length === 1 ? "link" : "links"}
                      </>
                    )}
                  </span>
                ) : (
                  "Not shared yet"
                )}
              </p>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="flex gap-1 mt-5 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setActiveTab("people")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "people"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              People
            </button>
            <button
              onClick={() => setActiveTab("link")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "link"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link className="h-4 w-4" />
              Link
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {activeTab === "people" ? (
            <div className="space-y-5">
              {/* Email input with permission select */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Invite people</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                      className="pl-10 h-10"
                    />
                  </div>
                  <Select value={permission} onValueChange={(v: string) => setPermission(v as SharePermission)}>
                    <SelectTrigger className="w-[110px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Can view</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Can edit</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddPerson}
                    disabled={isPending || !email.trim()}
                    className="h-10 px-4"
                  >
                    {createUserShare.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              </div>

              {/* Shared people list */}
              <div className="space-y-3">
                <label className="text-sm font-medium">People with access</label>
                <ScrollArea className="h-[180px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : userShares.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No one has access yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Invite people by email to share
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
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
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Link settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Permission</p>
                      <p className="text-xs text-muted-foreground">What can people do?</p>
                    </div>
                  </div>
                  <Select value={linkPermission} onValueChange={(v: string) => setLinkPermission(v as SharePermission)}>
                    <SelectTrigger className="w-[110px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Can view</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Password protection</p>
                      <p className="text-xs text-muted-foreground">Require password to access</p>
                    </div>
                  </div>
                  <Switch
                    checked={hasPassword}
                    onCheckedChange={setHasPassword}
                  />
                </div>

                {hasPassword && (
                  <div className="pl-12">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Enter a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Expiration</p>
                      <p className="text-xs text-muted-foreground">Auto-disable after time</p>
                    </div>
                  </div>
                  <Switch
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                </div>

                {hasExpiry && (
                  <div className="pl-12">
                    <Select value={expiryHours.toString()} onValueChange={(v: string) => setExpiryHours(parseInt(v))}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  className="w-full h-11 gap-2"
                  onClick={handleCreateLink}
                  disabled={isPending || (hasPassword && !password)}
                >
                  {createLinkShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      Create & Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Active links */}
              {linkShares.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <label className="text-sm font-medium">Active links</label>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {linkShares.map((share) => (
                        <LinkShareItem
                          key={share.id}
                          share={share}
                          onCopy={() => handleCopyLink(share.linkToken ?? "")}
                          onRemove={() => handleRemoveShare(share.id)}
                          isPending={deleteShare.isPending}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
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
  const initials = (share.sharedWithName ?? share.sharedWithEmail ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "bg-blue-500/10 text-blue-600",
    "bg-green-500/10 text-green-600",
    "bg-purple-500/10 text-purple-600",
    "bg-orange-500/10 text-orange-600",
    "bg-pink-500/10 text-pink-600",
    "bg-cyan-500/10 text-cyan-600",
  ];

  const colorIndex = (share.sharedWithEmail?.charCodeAt(0) ?? 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <div className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", avatarColor)}>
          <span className="text-sm font-semibold">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {share.sharedWithName ?? share.sharedWithEmail}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {share.permission === "edit" ? (
              <>
                <Pencil className="h-3 w-3" />
                <span>Can edit</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>Can view</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={isPending}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface LinkShareItemProps {
  share: ShareWithDetails;
  onCopy: () => void;
  onRemove: () => void;
  isPending?: boolean;
}

function LinkShareItem({ share, onCopy, onRemove, isPending }: LinkShareItemProps) {
  const isExpired = share.expiresAt ? new Date(share.expiresAt) < new Date() : false;

  return (
    <div className={cn(
      "group flex items-center justify-between p-3 rounded-lg border transition-colors",
      isExpired
        ? "bg-destructive/5 border-destructive/20"
        : "bg-muted/30 border-border/50 hover:border-border"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          isExpired ? "bg-destructive/10" : "bg-primary/10"
        )}>
          <Globe className={cn("h-4 w-4", isExpired ? "text-destructive" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {share.permission === "edit" ? "Can edit" : "Can view"}
            </span>
            {share.linkPassword && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600">
                <Lock className="h-2.5 w-2.5" />
                Protected
              </span>
            )}
          </div>
          {share.expiresAt && (
            <p className={cn(
              "text-xs mt-0.5",
              isExpired ? "text-destructive" : "text-muted-foreground"
            )}>
              {isExpired ? "Expired" : `Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          disabled={isExpired}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
