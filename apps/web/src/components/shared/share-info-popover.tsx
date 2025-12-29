"use client";

import { User, Calendar, HardDrive, AlertCircle, Info, Clock, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ShareInfo {
  ownerName: string;
  permission: "view" | "edit";
  expiresAt: string | null;
}

interface ItemInfo {
  name: string;
  type: "folder" | "asset";
  size?: number;
  mimeType?: string;
  createdAt: string;
}

interface ShareInfoPopoverProps {
  share: ShareInfo;
  item: ItemInfo;
  variant?: "light" | "dark";
  className?: string;
}

export function ShareInfoPopover({
  share,
  item,
  variant = "dark",
  className,
}: ShareInfoPopoverProps) {
  const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
  const isAsset = item.type === "asset";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full",
            variant === "dark"
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
            className
          )}
        >
          <Info className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-80 p-0 overflow-hidden",
          variant === "dark" && "bg-background/95 backdrop-blur-xl border-white/10"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <h3 className="font-semibold text-sm">File Information</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Owner */}
          <InfoRow
            icon={User}
            label="Shared by"
            value={share.ownerName}
          />

          {/* Permission */}
          <InfoRow
            icon={share.permission === "edit" ? Pencil : Eye}
            label="Permission"
            value={share.permission === "edit" ? "Can edit" : "View only"}
          />

          {/* Size (for assets) */}
          {isAsset && item.size !== undefined && (
            <InfoRow
              icon={HardDrive}
              label="Size"
              value={formatFileSize(item.size)}
            />
          )}

          {/* Created date */}
          <InfoRow
            icon={Calendar}
            label="Created"
            value={formatRelativeTime(new Date(item.createdAt))}
          />

          {/* Expiration */}
          {share.expiresAt && (
            <InfoRow
              icon={isExpired ? AlertCircle : Clock}
              label={isExpired ? "Expired" : "Expires"}
              value={formatRelativeTime(new Date(share.expiresAt))}
              variant={isExpired ? "destructive" : "warning"}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: "default" | "warning" | "destructive";
}

function InfoRow({ icon: Icon, label, value, variant = "default" }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          variant === "default" && "bg-muted/50",
          variant === "warning" && "bg-amber-500/10",
          variant === "destructive" && "bg-destructive/10"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "default" && "text-muted-foreground",
            variant === "warning" && "text-amber-500",
            variant === "destructive" && "text-destructive"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-sm font-medium truncate",
            variant === "warning" && "text-amber-600",
            variant === "destructive" && "text-destructive"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
