"use client";

import { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSharesForItem,
  useCreateUserShare,
  useCreateLinkShare,
  useDeleteShare,
} from "@/hooks/use-shares";
import { shareService } from "@/services/share-service";
import { toast } from "sonner";
import {
  Copy,
  Link2,
  Trash2,
  Loader2,
  Lock,
  Clock,
  Globe,
  X,
  Check,
  Mail,
  Users,
} from "lucide-react";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { Folder as FolderType } from "@/types/folder";
import type { Asset } from "@/types/asset";
import type { SharePermission, ShareWithDetails } from "@/types/share";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FolderType | Asset | null;
  itemType: "folder" | "asset";
}

export function ShareDialog({
  open,
  onOpenChange,
  item,
  itemType,
}: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [linkPermission, setLinkPermission] = useState<SharePermission>("view");
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const { data: shares = [], isLoading } = useSharesForItem(
    itemType,
    item?.id ?? "",
  );
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
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
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
          toast.success("Link created and copied!");
          setPassword("");
          setHasPassword(false);
          setHasExpiry(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleCopyLink = (token: string, shareId: string) => {
    const link = shareService.generateShareLink(token);
    navigator.clipboard.writeText(link);
    setCopiedLinkId(shareId);
    setTimeout(() => setCopiedLinkId(null), 2000);
    toast.success("Link copied!");
  };

  const handleRemoveShare = (shareId: string) => {
    deleteShare.mutate(shareId, {
      onSuccess: () => toast.success("Access removed"),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const isPending =
    createUserShare.isPending ||
    createLinkShare.isPending ||
    deleteShare.isPending;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className="sm:max-w-md p-0 gap-0 max-h-[90vh] flex flex-col"
        drawerClassName="px-0 pb-0"
      >
        {/* Header */}
        <ResponsiveDialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <ResponsiveDialogTitle className="text-lg font-medium truncate pr-8">
            Share &apos;{item?.name}&apos;
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "link" | "email")}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 shrink-0">
            <TabsList className="w-full grid grid-cols-2 h-10">
              <TabsTrigger value="link" className="gap-2 text-sm">
                <Link2 className="h-4 w-4" />
                Get Link
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2 text-sm">
                <Mail className="h-4 w-4" />
                Invite People
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Get Link Tab */}
          <TabsContent
            value="link"
            className="flex-1 overflow-auto mt-0 px-6 pb-6"
          >
            <div className="space-y-4 pt-4">
              {/* Existing links */}
              {linkShares.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Active Links
                  </h3>
                  <div className="space-y-2">
                    {linkShares.map((share) => (
                      <LinkItem
                        key={share.id}
                        share={share}
                        onCopy={() =>
                          handleCopyLink(share.linkToken ?? "", share.id)
                        }
                        onRemove={() => handleRemoveShare(share.id)}
                        isCopied={copiedLinkId === share.id}
                        isPending={deleteShare.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Create new link section */}
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Create New Link
                </h3>

                {/* Link permission */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Anyone with link</span>
                  </div>
                  <Select
                    value={linkPermission}
                    onValueChange={(v) =>
                      setLinkPermission(v as SharePermission)
                    }
                  >
                    <SelectTrigger className="w-25 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Can view</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password protection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password-toggle"
                      className="text-sm flex items-center gap-3 cursor-pointer"
                    >
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Password protect
                    </Label>
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
                      className="h-9"
                    />
                  )}
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="expiry-toggle"
                      className="text-sm flex items-center gap-3 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Set expiration
                    </Label>
                    <Switch
                      id="expiry-toggle"
                      checked={hasExpiry}
                      onCheckedChange={setHasExpiry}
                    />
                  </div>
                  {hasExpiry && (
                    <Select
                      value={expiryHours.toString()}
                      onValueChange={(v) => setExpiryHours(parseInt(v))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="24">1 day</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Create and copy button */}
                <Button
                  onClick={handleCreateLink}
                  disabled={isPending || (hasPassword && !password)}
                  className="w-full h-10"
                >
                  {createLinkShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Create & Copy Link
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Invite People Tab */}
          <TabsContent
            value="email"
            className="flex-1 overflow-auto mt-0 px-6 pb-6"
          >
            <div className="space-y-4 pt-4">
              {/* Email input */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                    className="h-10"
                  />
                  <Select
                    value={permission}
                    onValueChange={(v) => setPermission(v as SharePermission)}
                  >
                    <SelectTrigger className="w-25 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Viewer</SelectItem>
                      <SelectItem value="edit">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddPerson}
                  disabled={isPending || !email.trim()}
                  className="w-full h-10"
                >
                  {createUserShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Invite
                </Button>
              </div>

              {/* People with access */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    People with access
                  </h3>
                  {userShares.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {userShares.length}
                    </span>
                  )}
                </div>

                <ScrollArea
                  className={cn(userShares.length > 4 && "h-50")}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : userShares.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No one has access yet
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Add people by email above
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {userShares.map((share) => (
                        <PersonItem
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
          </TabsContent>
        </Tabs>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface PersonItemProps {
  share: ShareWithDetails;
  onRemove: () => void;
  isPending?: boolean;
}

function PersonItem({ share, onRemove, isPending }: PersonItemProps) {
  const name = share.sharedWithName ?? share.sharedWithEmail ?? "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  const colorIndex =
    (share.sharedWithEmail?.charCodeAt(0) ?? 0) % colors.length;

  return (
    <div className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0",
          colors[colorIndex],
        )}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {share.sharedWithName && share.sharedWithEmail && (
          <p className="text-xs text-muted-foreground truncate">
            {share.sharedWithEmail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {share.permission === "edit" ? "Editor" : "Viewer"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isPending}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LinkItemProps {
  share: ShareWithDetails;
  onCopy: () => void;
  onRemove: () => void;
  isCopied?: boolean;
  isPending?: boolean;
}

function LinkItem({
  share,
  onCopy,
  onRemove,
  isCopied,
  isPending,
}: LinkItemProps) {
  const isExpired = share.expiresAt
    ? new Date(share.expiresAt) < new Date()
    : false;

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors",
        isExpired
          ? "bg-destructive/5 border-destructive/20"
          : "bg-muted/30 border-transparent",
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isExpired
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <Globe className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {share.permission === "edit" ? "Can edit" : "Can view"}
          </span>
          {share.linkPassword && (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isExpired ? (
            <span className="text-destructive">Expired</span>
          ) : share.expiresAt ? (
            `Expires ${new Date(share.expiresAt).toLocaleDateString()}`
          ) : (
            "No expiration"
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          disabled={isExpired}
          className="h-8 w-8"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isPending}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
