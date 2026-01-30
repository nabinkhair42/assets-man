"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schema/auth-schema";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    startTransition(async () => {
      try {
        await authService.forgotPassword(values.email);
        setIsSubmitted(true);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="mx-auto w-11 h-11 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            If an account exists for {form.getValues("email")}, we&apos;ve sent
            a password reset link.
          </p>

          <div className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                }}
                className="text-primary font-medium hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Forgot password?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
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
            loadingText="Sending"
          >
            Send reset link
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
