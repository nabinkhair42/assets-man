import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { storageKeys } from "./use-storage";
import { useAuth } from "@/providers/auth-provider";
import { setCachedToken, clearCachedToken } from "@/lib/safe-storage";
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/types/auth";

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
      setCachedToken(data.tokens.accessToken);
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
      setCachedToken(data.tokens.accessToken);
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
      clearCachedToken();
      queryClient.clear();
      setUser(null);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => authService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
      setUser(data.user);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (data: ChangePasswordInput) => authService.changePassword(data),
    onSuccess: () => {
      clearCachedToken();
      queryClient.clear();
      setUser(null);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (password: string) => authService.deleteAccount(password),
    onSuccess: () => {
      clearCachedToken();
      queryClient.clear();
      setUser(null);
    },
  });
}
