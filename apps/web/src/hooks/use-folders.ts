import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { folderService } from "@/services/folder-service";
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  FolderContentsParams,
  CopyFolderInput,
} from "@/types/folder";

export const folderKeys = {
  all: ["folders"] as const,
  lists: () => [...folderKeys.all, "list"] as const,
  list: () => [...folderKeys.lists(), "all"] as const,
  contents: (params?: FolderContentsParams) =>
    [...folderKeys.lists(), "contents", params] as const,
  details: () => [...folderKeys.all, "detail"] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
};

export function useFolders() {
  return useQuery({
    queryKey: folderKeys.list(),
    queryFn: () => folderService.getAll(),
  });
}

export function useFolderContents(params?: FolderContentsParams) {
  return useQuery({
    queryKey: folderKeys.contents(params),
    queryFn: () => folderService.getContents(params),
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: () => folderService.getById(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderInput) => folderService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFolderInput }) =>
      folderService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
      queryClient.setQueryData(folderKeys.detail(data.id), data);
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveFolderInput }) =>
      folderService.move(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}

export function useToggleFolderStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderService.toggleStarred(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["starred"] });
      queryClient.setQueryData(folderKeys.detail(data.id), data);
    },
  });
}

export function useStarredFolders() {
  return useQuery({
    queryKey: ["starred", "folders"],
    queryFn: () => folderService.listStarred(),
  });
}

export function useCopyFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CopyFolderInput }) =>
      folderService.copy(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });
    },
  });
}
