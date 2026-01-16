import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  EmptyFolderIllustration,
  EmptyStarredIllustration,
  EmptyRecentIllustration,
  EmptyTrashIllustration,
  EmptySearchIllustration,
  EmptyUploadIllustration,
  EmptyShareIllustration,
} from "./illustrations";

export type EmptyStateVariant = "folder" | "starred" | "recent" | "trash" | "search" | "upload" | "share" | "custom";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon; // For custom variant
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  actions?: EmptyStateAction[];
}

const illustrationMap = {
  folder: EmptyFolderIllustration,
  starred: EmptyStarredIllustration,
  recent: EmptyRecentIllustration,
  trash: EmptyTrashIllustration,
  search: EmptySearchIllustration,
  upload: EmptyUploadIllustration,
  share: EmptyShareIllustration,
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
  const Illustration = variant !== "custom" ? illustrationMap[variant] : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] py-12 px-4 text-center",
        className
      )}
    >
      {/* Illustration or Icon */}
      <div className="mb-6 animate-fade-in">
        {Illustration ? (
          <Illustration className="w-40 h-40 sm:w-48 sm:h-48" />
        ) : CustomIcon ? (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
            <CustomIcon className="relative h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/50" />
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="max-w-md space-y-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h3 className="text-lg sm:text-xl font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div
          className="flex flex-col sm:flex-row gap-3 mt-8 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? "default" : "outline")}
                onClick={action.onClick}
                size="lg"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Custom children */}
      {children && (
        <div className="mt-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {children}
        </div>
      )}
    </div>
  );
}
