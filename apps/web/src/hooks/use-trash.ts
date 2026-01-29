import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { trashService } from "@/services/trash-service";
import type { ListTrashParams } from "@/types/trash";
import { assetKeys } from "./use-assets";
import { storageKeys } from "./use-storage";

export const trashKeys = {
  all: ["trash"] as const,
  lists: () => [...trashKeys.all, "list"] as const,
  list: (params?: ListTrashParams) => [...trashKeys.lists(), params] as const,
};

const DEFAULT_LIMIT = 20;

export function useInfiniteTrash(params?: Omit<ListTrashParams, "page" | "limit"> & { limit?: number }) {
  const limit = params?.limit ?? DEFAULT_LIMIT;

  return useInfiniteQuery({
    queryKey: [...trashKeys.lists(), "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      return trashService.list({
        ...params,
        page: pageParam,
        limit,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: "asset" | "folder" }) =>
      trashService.restore(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function usePermanentlyDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: "asset" | "folder" }) =>
      trashService.permanentlyDelete(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.stats() });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trashService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storageKeys.stats() });
    },
  });
}
