"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/use-auth";
import type { User } from "@/types";

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
      const token = localStorage.getItem("accessToken");
      
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

        // Fetch user data
        const { authService } = await import("@/services/auth-service");
        const { storageKeys } = await import("@/hooks/use-storage");
        const response = await authService.getMe();
        setUser(response.user);
        queryClient.setQueryData(authKeys.me(), response.user);
        // Cache storage stats from the response
        if (response.storageStats) {
          queryClient.setQueryData(storageKeys.stats(), response.storageStats);
        }
      } catch {
        // Token is invalid, clear it
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
      }}
    >
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
