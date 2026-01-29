import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type { PaginatedResponse, ApiResponse } from "@/types/api";
import type { Asset } from "@/types/asset";
import type { Folder } from "@/types/folder";
import type {
  TrashedItem,
  ListTrashParams,
  PaginatedTrash,
  EmptyTrashResult,
} from "@/types/trash";

export const trashService = {
  async list(params?: ListTrashParams): Promise<PaginatedTrash> {
    const response = await apiClient.get<PaginatedResponse<TrashedItem>>(
      API_ENDPOINTS.TRASH.BASE,
      { params }
    );
    return {
      items: response.data.data,
      ...response.data.pagination,
    };
  },

  async restore(id: string, type: "asset" | "folder"): Promise<Asset | Folder> {
    const response = await apiClient.post<ApiResponse<{ asset?: Asset; folder?: Folder }>>(
      API_ENDPOINTS.TRASH.RESTORE(id),
      undefined,
      { params: { type } }
    );
    return type === "asset" ? response.data.data.asset! : response.data.data.folder!;
  },

  async permanentlyDelete(id: string, type: "asset" | "folder"): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TRASH.PERMANENT_DELETE(id), {
      params: { type },
    });
  },

  async emptyTrash(): Promise<EmptyTrashResult> {
    const response = await apiClient.delete<ApiResponse<EmptyTrashResult>>(
      API_ENDPOINTS.TRASH.BASE
    );
    return response.data.data;
  },
};
