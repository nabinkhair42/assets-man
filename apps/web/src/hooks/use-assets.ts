import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { assetService } from "@/services/asset-service";
import type {
  RequestUploadInput,
  UpdateAssetInput,
  ListAssetsParams,
} from "@/types";

export const assetKeys = {
  all: ["assets"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (params?: ListAssetsParams) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

export function useAssets(params?: ListAssetsParams) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => assetService.list(params),
  });
}

const DEFAULT_LIMIT = 20;

export function useInfiniteAssets(params?: Omit<ListAssetsParams, "page" | "limit"> & { limit?: number }) {
  const limit = params?.limit ?? DEFAULT_LIMIT;

  return useInfiniteQuery({
    queryKey: [...assetKeys.lists(), "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      return assetService.list({
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

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetService.getById(id),
    enabled: !!id,
  });
}

export function useRequestUpload() {
  return useMutation({
    mutationFn: (input: RequestUploadInput) => assetService.requestUpload(input),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderId,
      onProgress,
    }: {
      file: File;
      folderId?: string;
      onProgress?: (progress: number) => void;
    }) => {
      // Request presigned URL
      const { uploadUrl, asset } = await assetService.requestUpload({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        folderId,
      });

      // Upload file to storage with progress tracking
      await assetService.uploadFile(uploadUrl, file, onProgress);

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useDownloadUrl(id: string) {
  return useQuery({
    queryKey: [...assetKeys.detail(id), "download"],
    queryFn: () => assetService.getDownloadUrl(id),
    enabled: !!id,
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) =>
      assetService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.setQueryData(assetKeys.detail(data.id), data);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useToggleAssetStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetService.toggleStarred(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["starred"] });
      queryClient.setQueryData(assetKeys.detail(data.id), data);
    },
  });
}

export function useStarredAssets(params?: { page?: number; limit?: number }) {
  return useInfiniteQuery({
    queryKey: ["starred", "assets", params],
    queryFn: async ({ pageParam = 1 }) => {
      return assetService.listStarred({
        ...params,
        page: pageParam,
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
