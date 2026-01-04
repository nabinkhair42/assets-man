"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DataList - A reusable list view component similar to shadcn's data-table
 * Provides consistent styling for file/folder lists across all pages
 */

// Column definition
export interface DataListColumn {
  /** Column header label */
  label: string;
  /** Fixed width class (e.g., "w-24", "w-32") */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Hide below this breakpoint */
  hideBelow?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

// DataList Root
interface DataListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataList = React.forwardRef<HTMLDivElement, DataListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  )
);
DataList.displayName = "DataList";

// DataList Header
const hideClasses = {
  sm: "hidden sm:flex",
  md: "hidden md:flex",
  lg: "hidden lg:flex",
};

interface DataListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataListColumn[];
}

const DataListHeader = React.forwardRef<HTMLDivElement, DataListHeaderProps>(
  ({ className, columns, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-2 text-xs font-medium text-muted-foreground tracking-wider border-b border-border/60 mb-1",
        className
      )}
      {...props}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center",
            col.width || "flex-1 min-w-0",
            col.align === "right" && "justify-end text-right",
            col.align === "center" && "justify-center text-center",
            col.hideBelow && hideClasses[col.hideBelow],
            !col.hideBelow && "flex",
            col.className
          )}
        >
          {col.label}
        </div>
      ))}
    </div>
  )
);
DataListHeader.displayName = "DataListHeader";

// DataList Body
interface DataListBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataListBody = React.forwardRef<HTMLDivElement, DataListBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  )
);
DataListBody.displayName = "DataListBody";

// DataList Row - Base component for list rows
interface DataListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  pending?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
}

const DataListRow = React.forwardRef<HTMLDivElement, DataListRowProps>(
  ({ className, selected, pending, dragging, dropTarget, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
        "hover:bg-accent/50 rounded-lg",
        dragging && "opacity-50 cursor-grabbing",
        dropTarget && "ring-2 ring-primary bg-primary/10",
        pending && "bg-primary/20 ring-2 ring-primary ring-inset",
        selected && "bg-primary/15 ring-2 ring-primary/60 ring-inset",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataListRow.displayName = "DataListRow";

// DataList Cell - Individual cell in a row
interface DataListCellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed width class */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Hide below this breakpoint */
  hideBelow?: "sm" | "md" | "lg";
  /** Whether this is the main/name cell (flex-1) */
  primary?: boolean;
}

const DataListCell = React.forwardRef<HTMLDivElement, DataListCellProps>(
  ({ className, width, align, hideBelow, primary, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center",
        primary && "flex-1 min-w-0",
        width,
        align === "right" && "justify-end text-right",
        align === "center" && "justify-center text-center",
        hideBelow && hideClasses[hideBelow],
        !hideBelow && !primary && "flex",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataListCell.displayName = "DataListCell";

// DataList Empty - Empty state
interface DataListEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType;
  title: string;
  description?: string;
}

const DataListEmpty = React.forwardRef<HTMLDivElement, DataListEmptyProps>(
  ({ className, icon: Icon, title, description, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-muted-foreground font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
      )}
    </div>
  )
);
DataListEmpty.displayName = "DataListEmpty";

// Grid Layout Components
interface DataGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataGrid = React.forwardRef<HTMLDivElement, DataGridProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-6", className)} {...props}>
      {children}
    </div>
  )
);
DataGrid.displayName = "DataGrid";

interface DataGridSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
}

const DataGridSection = React.forwardRef<HTMLDivElement, DataGridSectionProps>(
  ({ className, title, children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
);
DataGridSection.displayName = "DataGridSection";

interface DataGridFolderContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataGridFolderContainer = React.forwardRef<HTMLDivElement, DataGridFolderContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataGridFolderContainer.displayName = "DataGridFolderContainer";

interface DataGridFileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataGridFileContainer = React.forwardRef<HTMLDivElement, DataGridFileContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataGridFileContainer.displayName = "DataGridFileContainer";

// Grid Item Cards
interface DataGridFolderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  pending?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
}

const DataGridFolderCard = React.forwardRef<HTMLDivElement, DataGridFolderCardProps>(
  ({ className, selected, pending, dragging, dropTarget, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border/40 bg-card transition-all duration-150",
        "hover:border-border hover:bg-accent/30",
        dragging && "opacity-50 scale-105",
        dropTarget && "border-primary bg-primary/10",
        pending && "border-primary bg-primary/5",
        selected && "border-primary/60 bg-primary/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataGridFolderCard.displayName = "DataGridFolderCard";

interface DataGridFileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  pending?: boolean;
  dragging?: boolean;
}

const DataGridFileCard = React.forwardRef<HTMLDivElement, DataGridFileCardProps>(
  ({ className, selected, pending, dragging, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-transparent transition-all duration-200",
        "hover:border-border/60 hover:shadow-lg hover:shadow-black/5",
        dragging && "opacity-50 scale-105",
        pending && "border-primary bg-primary/5",
        selected && "border-primary/60 bg-primary/5 shadow-md shadow-primary/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataGridFileCard.displayName = "DataGridFileCard";

// Selection Checkmark
const SelectionCheckmark = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0",
        className
      )}
      {...props}
    >
      <svg
        className="h-3 w-3 text-primary-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
);
SelectionCheckmark.displayName = "SelectionCheckmark";

export {
  DataList,
  DataListHeader,
  DataListBody,
  DataListRow,
  DataListCell,
  DataListEmpty,
  DataGrid,
  DataGridSection,
  DataGridFolderContainer,
  DataGridFileContainer,
  DataGridFolderCard,
  DataGridFileCard,
  SelectionCheckmark,
};
