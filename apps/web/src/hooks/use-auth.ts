import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { storageKeys } from "./use-storage";
import { useAuth } from "@/providers/auth-provider";
import type { RegisterInput, LoginInput } from "@/types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useUser() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await authService.getMe();
      // Cache storage stats from the response
      if (response.storageStats) {
        queryClient.setQueryData(storageKeys.stats(), response.storageStats);
      }
      return response.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.tokens.accessToken);
      queryClient.setQueryData(authKeys.me(), data.user);
      setUser(data.user);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.tokens.accessToken);
      queryClient.setQueryData(authKeys.me(), data.user);
      setUser(data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      queryClient.clear();
      setUser(null);
    },
  });
}
