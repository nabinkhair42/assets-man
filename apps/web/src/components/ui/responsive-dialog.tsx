"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogContextValue {
  isMobile: boolean;
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isMobile: false,
});

function useResponsiveDialog() {
  const context = React.useContext(ResponsiveDialogContext);
  if (!context) {
    throw new Error("useResponsiveDialog must be used within a ResponsiveDialog");
  }
  return context;
}

interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ResponsiveDialog({ children, open, onOpenChange }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          // Prevent closing when interacting with inputs (keyboard)
          dismissible
          // Handle repository on scroll
          handleOnly={false}
        >
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </ResponsiveDialogContext.Provider>
  );
}

function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }
  return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

function ResponsiveDialogClose({
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>;
  }
  return <DialogClose {...props}>{children}</DialogClose>;
}

interface ResponsiveDialogContentProps
  extends React.ComponentProps<typeof DialogContent> {
  drawerClassName?: string;
}

function ResponsiveDialogContent({
  children,
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          // Max height that leaves room for keyboard
          "max-h-[85vh]",
          // Ensure content can scroll when keyboard opens
          "flex flex-col",
          drawerClassName
        )}
        {...(props as React.ComponentProps<typeof DrawerContent>)}
      >
        {/* Scrollable wrapper for keyboard support */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      className={cn("max-h-[85vh] flex flex-col overflow-hidden", className)}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerHeader
        className={cn(
          // Sticky header on mobile so user always sees title
          "sticky top-0 z-10 bg-background pb-2",
          className
        )}
        {...props}
      />
    );
  }
  return <DialogHeader className={className} {...props} />;
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(
          // Sticky footer on mobile so buttons are always accessible
          "sticky bottom-0 z-10 bg-background pt-2 border-t",
          className
        )}
        {...props}
      />
    );
  }
  return <DialogFooter className={className} {...props} />;
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }
  return <DialogTitle className={className} {...props} />;
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />;
  }
  return <DialogDescription className={className} {...props} />;
}

// Body component for main content area (useful for forms with inputs)
function ResponsiveDialogBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveDialog();

  return (
    <div
      className={cn(
        // Scrollable with custom styled scrollbar
        "flex-1 min-h-0 overflow-y-auto",
        // Custom scrollbar styling
        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        // Webkit scrollbar styling
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-border",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50",
        isMobile ? "px-4 py-2" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  useResponsiveDialog,
};
