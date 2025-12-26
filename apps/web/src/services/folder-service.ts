import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type {
  ApiResponse,
  Folder,
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  FolderContentsParams,
} from "@/types";

export const folderService = {
  async getAll(): Promise<Folder[]> {
    const response = await apiClient.get<ApiResponse<{ folders: Folder[] }>>(
      API_ENDPOINTS.FOLDERS.BASE
    );
    return response.data.data.folders;
  },

  async getContents(params?: FolderContentsParams): Promise<Folder[]> {
    const response = await apiClient.get<ApiResponse<{ folders: Folder[] }>>(
      API_ENDPOINTS.FOLDERS.CONTENTS,
      { params: { parentId: params?.parentId } }
    );
    return response.data.data.folders;
  },

  async getById(id: string): Promise<Folder> {
    const response = await apiClient.get<ApiResponse<{ folder: Folder }>>(
      API_ENDPOINTS.FOLDERS.BY_ID(id)
    );
    return response.data.data.folder;
  },

  async create(input: CreateFolderInput): Promise<Folder> {
    const response = await apiClient.post<ApiResponse<{ folder: Folder }>>(
      API_ENDPOINTS.FOLDERS.BASE,
      input
    );
    return response.data.data.folder;
  },

  async update(id: string, input: UpdateFolderInput): Promise<Folder> {
    const response = await apiClient.patch<ApiResponse<{ folder: Folder }>>(
      API_ENDPOINTS.FOLDERS.BY_ID(id),
      input
    );
    return response.data.data.folder;
  },

  async move(id: string, input: MoveFolderInput): Promise<Folder> {
    const response = await apiClient.patch<ApiResponse<{ folder: Folder }>>(
      API_ENDPOINTS.FOLDERS.MOVE(id),
      input
    );
    return response.data.data.folder;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FOLDERS.BY_ID(id));
  },
};
