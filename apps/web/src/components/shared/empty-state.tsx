import {
  type LucideIcon,
  Folder,
  Star,
  Clock,
  Trash2,
  Search,
  CloudUpload,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmptyStateVariant =
  | "folder"
  | "starred"
  | "recent"
  | "trash"
  | "search"
  | "upload"
  | "share"
  | "custom";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  actions?: EmptyStateAction[];
}

const iconMap: Record<Exclude<EmptyStateVariant, "custom">, LucideIcon> = {
  folder: Folder,
  starred: Star,
  recent: Clock,
  trash: Trash2,
  search: Search,
  upload: CloudUpload,
  share: Share2,
};

export function EmptyState({
  variant = "custom",
  icon: CustomIcon,
  title,
  description,
  className,
  children,
  actions,
}: EmptyStateProps) {
  const Icon = variant !== "custom" ? iconMap[variant] : CustomIcon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-100 py-12 px-4 text-center",
        className,
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-6">
          <Icon
            className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg sm:text-xl font-medium text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={
                  action.variant || (index === 0 ? "default" : "outline")
                }
                onClick={action.onClick}
                size="lg"
              >
                {ActionIcon && <ActionIcon className="size-4" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Custom children */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
