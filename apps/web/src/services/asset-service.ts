import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type {
  ApiResponse,
  PaginatedResponse,
  Asset,
  RequestUploadInput,
  UploadUrlResponse,
  UpdateAssetInput,
  ListAssetsParams,
  PaginatedAssets,
  DownloadUrlResponse,
  CopyAssetInput,
  BulkDownloadInput,
} from "@/types";

export const assetService = {
  async list(params?: ListAssetsParams): Promise<PaginatedAssets> {
    const response = await apiClient.get<PaginatedResponse<Asset>>(
      API_ENDPOINTS.ASSETS.BASE,
      { params }
    );
    return {
      assets: response.data.data,
      ...response.data.pagination,
    };
  },

  async getById(id: string): Promise<Asset> {
    const response = await apiClient.get<ApiResponse<{ asset: Asset }>>(
      API_ENDPOINTS.ASSETS.BY_ID(id)
    );
    return response.data.data.asset;
  },

  async requestUpload(input: RequestUploadInput): Promise<UploadUrlResponse> {
    const response = await apiClient.post<ApiResponse<UploadUrlResponse>>(
      API_ENDPOINTS.ASSETS.UPLOAD,
      input
    );
    return response.data.data;
  },

  async uploadFile(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  },

  async getDownloadUrl(id: string): Promise<DownloadUrlResponse> {
    const response = await apiClient.get<ApiResponse<DownloadUrlResponse>>(
      API_ENDPOINTS.ASSETS.DOWNLOAD(id)
    );
    return response.data.data;
  },

  // Get download URL for shared asset (or owned asset)
  async getSharedDownloadUrl(id: string): Promise<DownloadUrlResponse> {
    const response = await apiClient.get<ApiResponse<DownloadUrlResponse>>(
      API_ENDPOINTS.ASSETS.SHARED_DOWNLOAD(id)
    );
    return response.data.data;
  },

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    const response = await apiClient.patch<ApiResponse<{ asset: Asset }>>(
      API_ENDPOINTS.ASSETS.BY_ID(id),
      input
    );
    return response.data.data.asset;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ASSETS.BY_ID(id));
  },

  async search(query: string, limit: number = 10): Promise<Asset[]> {
    const response = await apiClient.get<PaginatedResponse<Asset>>(
      API_ENDPOINTS.ASSETS.BASE,
      { params: { search: query, limit } }
    );
    return response.data.data;
  },

  async toggleStarred(id: string): Promise<Asset> {
    const response = await apiClient.post<ApiResponse<{ asset: Asset }>>(
      API_ENDPOINTS.ASSETS.STAR(id)
    );
    return response.data.data.asset;
  },

  async listStarred(params?: { page?: number; limit?: number }): Promise<PaginatedAssets> {
    const response = await apiClient.get<PaginatedResponse<Asset>>(
      API_ENDPOINTS.ASSETS.STARRED,
      { params }
    );
    return {
      assets: response.data.data,
      ...response.data.pagination,
    };
  },

  async copy(id: string, input: CopyAssetInput): Promise<Asset> {
    const response = await apiClient.post<ApiResponse<{ asset: Asset }>>(
      API_ENDPOINTS.ASSETS.COPY(id),
      input
    );
    return response.data.data.asset;
  },

  async bulkDownload(input: BulkDownloadInput): Promise<Blob> {
    const response = await apiClient.post(
      API_ENDPOINTS.ASSETS.BULK_DOWNLOAD,
      input,
      { responseType: "blob" }
    );
    return response.data;
  },

  async sharedBulkDownload(assetIds: string[]): Promise<Blob> {
    const response = await apiClient.post(
      API_ENDPOINTS.ASSETS.SHARED_BULK_DOWNLOAD,
      { assetIds },
      { responseType: "blob" }
    );
    return response.data;
  },

  async getThumbnailUrl(id: string): Promise<{ url: string | null; canGenerate: boolean }> {
    const response = await apiClient.get<ApiResponse<{ url: string | null; canGenerate?: boolean }>>(
      API_ENDPOINTS.ASSETS.THUMBNAIL(id)
    );
    return {
      url: response.data.data.url,
      canGenerate: response.data.data.canGenerate ?? false,
    };
  },

  async generateThumbnail(id: string): Promise<{ thumbnailKey: string }> {
    const response = await apiClient.post<ApiResponse<{ thumbnailKey: string }>>(
      API_ENDPOINTS.ASSETS.THUMBNAIL(id)
    );
    return response.data.data;
  },

  async regenerateAllThumbnails(): Promise<{ processed: number; succeeded: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<{ processed: number; succeeded: number; failed: number }>>(
      API_ENDPOINTS.ASSETS.REGENERATE_THUMBNAILS
    );
    return response.data.data;
  },
};
