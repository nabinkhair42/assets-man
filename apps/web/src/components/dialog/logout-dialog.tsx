"use client";

import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/responsive-alert-dialog";
import { useLogout } from "@/hooks/use-auth";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <ResponsiveAlertDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            Confirm Logout
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            Are you sure you want to logout? You will need to sign in again to
            access your files.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Logging out" : "Logout"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
