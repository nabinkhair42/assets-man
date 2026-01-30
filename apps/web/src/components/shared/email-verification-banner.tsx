"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendVerification(user.email);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to resend verification email"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
            Please verify your email address.
          </p>
          <Button
            variant="link"
            size="sm"
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 px-0 h-auto font-medium shrink-0"
            onClick={handleResend}
            isLoading={isResending}
            loadingText="Sending"
          >
            Resend email
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 shrink-0 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
