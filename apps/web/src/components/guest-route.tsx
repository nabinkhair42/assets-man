"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AuthSkeleton } from "@/components/loaders/auth-skeleton";

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/files");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AuthSkeleton />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
