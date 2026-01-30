"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResponsiveAlertDialogContextValue {
  isMobile: boolean;
}

const ResponsiveAlertDialogContext = React.createContext<ResponsiveAlertDialogContextValue>({
  isMobile: false,
});

function useResponsiveAlertDialog() {
  const context = React.useContext(ResponsiveAlertDialogContext);
  if (!context) {
    throw new Error("useResponsiveAlertDialog must be used within a ResponsiveAlertDialog");
  }
  return context;
}

interface ResponsiveAlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ResponsiveAlertDialog({ children, open, onOpenChange }: ResponsiveAlertDialogProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveAlertDialogContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
          {children}
        </AlertDialog>
      )}
    </ResponsiveAlertDialogContext.Provider>
  );
}

interface ResponsiveAlertDialogContentProps
  extends React.ComponentProps<typeof AlertDialogContent> {
  drawerClassName?: string;
}

function ResponsiveAlertDialogContent({
  children,
  className,
  drawerClassName,
  ...props
}: ResponsiveAlertDialogContentProps) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn("max-h-[85vh]", drawerClassName)}
        {...(props as React.ComponentProps<typeof DrawerContent>)}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <AlertDialogContent className={className} {...props}>
      {children}
    </AlertDialogContent>
  );
}

function ResponsiveAlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogHeader>) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }
  return <AlertDialogHeader className={className} {...props} />;
}

function ResponsiveAlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogFooter>) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn("border-t border-border/40", className)}
        {...props}
      />
    );
  }
  return <AlertDialogFooter className={className} {...props} />;
}

function ResponsiveAlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogTitle>) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }
  return <AlertDialogTitle className={className} {...props} />;
}

function ResponsiveAlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogDescription>) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return <DrawerDescription className={cn("text-muted-foreground", className)} {...props} />;
  }
  return <AlertDialogDescription className={className} {...props} />;
}

interface ResponsiveAlertDialogActionProps
  extends React.ComponentProps<typeof AlertDialogAction> {}

function ResponsiveAlertDialogAction({
  className,
  children,
  ...props
}: ResponsiveAlertDialogActionProps) {
  const { isMobile } = useResponsiveAlertDialog();
  if (isMobile) {
    return (
      <Button className={className} {...props} variant={"destructive"}>
        {children}
      </Button>
    );
  }
  return (
    <AlertDialogAction className={className} {...props}>
      {children}
    </AlertDialogAction>
  );
}

interface ResponsiveAlertDialogCancelProps
  extends React.ComponentProps<typeof AlertDialogCancel> {}

function ResponsiveAlertDialogCancel({
  className,
  children,
  ...props
}: ResponsiveAlertDialogCancelProps) {
  const { isMobile } = useResponsiveAlertDialog();

  if (isMobile) {
    return (
      <DrawerClose asChild>
        <Button variant="outline" className={className} {...props}>
          {children}
        </Button>
      </DrawerClose>
    );
  }
  return (
    <AlertDialogCancel className={className} {...props}>
      {children}
    </AlertDialogCancel>
  );
}

export {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  useResponsiveAlertDialog,
};
