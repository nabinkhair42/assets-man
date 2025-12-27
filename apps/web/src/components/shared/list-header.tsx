import { cn } from "@/lib/utils";

interface ListHeaderColumn {
  label: string;
  width?: string;
  align?: "left" | "right";
  hideBelow?: "sm" | "md" | "lg";
}

interface ListHeaderProps {
  columns: ListHeaderColumn[];
  className?: string;
}

const hideClasses = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
};

export function ListHeader({ columns, className }: ListHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60 mb-1",
        className
      )}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className={cn(
            col.width || "flex-1 min-w-0",
            col.align === "right" && "text-right",
            col.hideBelow && hideClasses[col.hideBelow]
          )}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}
