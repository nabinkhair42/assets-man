import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService } from "@/services/storage-service";

export const storageKeys = {
  all: ["storage"] as const,
  stats: () => [...storageKeys.all, "stats"] as const,
};

export function useStorageStats() {
  return useQuery({
    queryKey: storageKeys.stats(),
    queryFn: () => storageService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on every focus
    refetchOnMount: false, // Use cached data if available
    retry: 1, // Only retry once on failure
  });
}

export function useRecalculateStorage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => storageService.recalculate(),
    onSuccess: (stats) => {
      queryClient.setQueryData(storageKeys.stats(), stats);
    },
  });
}

// Helper to invalidate storage stats (call after upload/delete)
export function useInvalidateStorage() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: storageKeys.stats() });
  };
}
