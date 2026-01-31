"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schema/auth-schema";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    startTransition(async () => {
      try {
        await authService.resetPassword(token, values.password);
        setIsSuccess(true);
        toast.success("Password reset successfully");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    });
  };

  // No token - show error
  if (!token) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="mx-auto w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            This password reset link is invalid or has expired.
          </p>

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/forgot-password">Request new link</Link>
            </Button>
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

  // Success state
  if (isSuccess) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="mx-auto w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Password reset!</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Your password has been reset successfully. You can now log in with your
            new password.
          </p>

          <Button className="w-full" asChild>
            <Link href="/login">Continue to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isPending}
            isLoading={isPending}
            loadingText="Resetting"
          >
            Reset password
          </Button>
        </form>
      </Form>

      {/* Footer */}
      <p className="text-sm text-muted-foreground text-center mt-4">
        <Link
          href="/login"
          className="text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to login
        </Link>
      </p>
    </div>
  );
}
