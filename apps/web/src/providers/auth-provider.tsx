"use client";

import { authKeys } from "@/hooks/use-auth";
import { storageKeys } from "@/hooks/use-storage";
import { clearCachedToken, getCachedToken } from "@/lib/safe-storage";
import { authService } from "@/services/auth-service";
import type { User } from "@/types/auth";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCachedToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get cached user data first
        const cachedUser = queryClient.getQueryData<User>(authKeys.me());
        if (cachedUser) {
          setUser(cachedUser);
          setIsLoading(false);
          return;
        }

        const response = await authService.getMe();
        setUser(response.user);
        queryClient.setQueryData(authKeys.me(), response.user);
        // Cache storage stats from the response
        if (response.storageStats) {
          queryClient.setQueryData(storageKeys.stats(), response.storageStats);
        }
      } catch {
        // Token is invalid, clear it
        clearCachedToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      setUser,
    }),
    [user, isLoading, setUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
