import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-64 text-muted-foreground", className)}>
      <Icon className="h-12 w-12 mb-4" />
      <p className="text-lg">{title}</p>
      {description && <p className="text-sm">{description}</p>}
      {children}
    </div>
  );
}
