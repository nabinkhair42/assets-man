"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/utils";
import { authService } from "@/services/auth-service";
import { ArrowLeft, CheckCircle, Loader, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type VerifyState = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <Loader className="w-5 h-5 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "No verification token provided"
  );
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setState("success");
      } catch (error) {
        setState("error");
        setErrorMessage(getApiErrorMessage(error, "Failed to verify email"));
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification(resendEmail);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to resend verification email"));
    } finally {
      setIsResending(false);
    }
  };

  if (state === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            <Loader className="w-5 h-5 text-primary animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Verifying your email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Email verified!
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Your email has been verified successfully. You can now enjoy all
            features.
          </p>
          <Button className="w-full" asChild>
            <Link href="/login">Continue to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Verification failed
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {errorMessage}
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
            <Button
              onClick={handleResend}
              isLoading={isResending}
              loadingText="Sending"
            >
              Resend
            </Button>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
