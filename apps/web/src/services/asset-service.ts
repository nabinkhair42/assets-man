import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type {
  ApiResponse,
  Asset,
  RequestUploadInput,
  UploadUrlResponse,
  UpdateAssetInput,
  ListAssetsParams,
  PaginatedAssets,
  DownloadUrlResponse,
} from "@/types";

export const assetService = {
  async list(params?: ListAssetsParams): Promise<PaginatedAssets> {
    const response = await apiClient.get<ApiResponse<PaginatedAssets>>(
      API_ENDPOINTS.ASSETS.BASE,
      { params }
    );
    return response.data.data;
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
};
