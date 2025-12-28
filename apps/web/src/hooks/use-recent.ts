"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recentService } from "@/services";
import type { RecordAccessInput } from "@/types";

export const RECENT_QUERY_KEY = ["recent"] as const;

export function useRecentItems(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...RECENT_QUERY_KEY, params],
    queryFn: () => recentService.list(params),
  });
}

export function useRecordAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordAccessInput) => recentService.recordAccess(input),
    onSuccess: () => {
      // Invalidate recent items list
      queryClient.invalidateQueries({ queryKey: RECENT_QUERY_KEY });
    },
  });
}

export function useClearRecentHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recentService.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECENT_QUERY_KEY });
    },
  });
}

export function useRemoveFromRecent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, itemType }: { id: string; itemType: "asset" | "folder" }) =>
      recentService.removeFromRecent(id, itemType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECENT_QUERY_KEY });
    },
  });
}
