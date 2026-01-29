import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareService } from "@/services/share-service";
import type {
  CreateUserShareInput,
  CreateLinkShareInput,
  UpdateShareInput,
} from "@/types/share";

export const shareKeys = {
  all: ["shares"] as const,
  mine: () => [...shareKeys.all, "mine"] as const,
  sharedWithMe: () => [...shareKeys.all, "shared-with-me"] as const,
  forItem: (itemType: "folder" | "asset", itemId: string) =>
    [...shareKeys.all, "item", itemType, itemId] as const,
  detail: (id: string) => [...shareKeys.all, "detail", id] as const,
};

export function useMyShares() {
  return useQuery({
    queryKey: shareKeys.mine(),
    queryFn: () => shareService.listMyShares(),
  });
}

export function useSharedWithMe() {
  return useQuery({
    queryKey: shareKeys.sharedWithMe(),
    queryFn: () => shareService.listSharedWithMe(),
  });
}

export function useSharesForItem(itemType: "folder" | "asset", itemId: string) {
  return useQuery({
    queryKey: shareKeys.forItem(itemType, itemId),
    queryFn: () => shareService.listSharesForItem(itemType, itemId),
    enabled: !!itemId,
  });
}

export function useShare(id: string) {
  return useQuery({
    queryKey: shareKeys.detail(id),
    queryFn: () => shareService.getShare(id),
    enabled: !!id,
  });
}

export function useCreateUserShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserShareInput) => shareService.createUserShare(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.all });
    },
  });
}

export function useCreateLinkShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLinkShareInput) => shareService.createLinkShare(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.all });
    },
  });
}

export function useUpdateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShareInput }) =>
      shareService.updateShare(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.all });
    },
  });
}

export function useDeleteShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shareService.deleteShare(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.all });
    },
  });
}
