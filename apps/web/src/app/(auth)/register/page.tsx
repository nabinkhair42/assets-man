"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerSchema, type RegisterFormValues } from "@/schema/auth-schema";
import { useRegisterSendOtp, useRegisterVerifyOtp } from "@/hooks";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();
  const sendOtp = useRegisterSendOtp();
  const verifyOtp = useRegisterVerifyOtp();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSubmit = (values: RegisterFormValues) => {
    sendOtp.mutate(values, {
      onSuccess: (data) => {
        setEmail(data.email);
        setStep("otp");
        setOtp("");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success("Verification code sent to your email");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleVerifyOtp = useCallback(() => {
    if (otp.length !== 6) return;
    verifyOtp.mutate(
      { email, otp },
      {
        onSuccess: () => {
          toast.success("Account created successfully");
          router.push("/files");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
          setOtp("");
        },
      }
    );
  }, [email, otp, verifyOtp, router]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    const values = form.getValues();
    sendOtp.mutate(values, {
      onSuccess: () => {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setOtp("");
        toast.success("New verification code sent");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleBack = () => {
    setStep("form");
    setOtp("");
  };

  if (step === "otp") {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={verifyOtp.isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full"
            disabled={otp.length !== 6 || verifyOtp.isPending}
            isLoading={verifyOtp.isPending}
            loadingText="Verifying"
            onClick={handleVerifyOtp}
          >
            Verify & Create Account
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || sendOtp.isPending}
              className="text-sm text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              {sendOtp.isPending
                ? "Sending..."
                : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : "Resend code"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign up to start managing your files
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
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

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={sendOtp.isPending}
            isLoading={sendOtp.isPending}
            loadingText="Sending code"
          >
            Create Account
          </Button>
        </form>
      </Form>

      {/* Footer */}
      <p className="text-sm text-muted-foreground text-center mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
