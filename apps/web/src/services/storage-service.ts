import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type { ApiResponse, StorageStats } from "@/types";

export const storageService = {
  async getStats(): Promise<StorageStats> {
    const response = await apiClient.get<ApiResponse<{ stats: StorageStats }>>(
      API_ENDPOINTS.STORAGE.STATS
    );
    return response.data.data.stats;
  },

  async recalculate(): Promise<StorageStats> {
    const response = await apiClient.post<ApiResponse<{ stats: StorageStats }>>(
      API_ENDPOINTS.STORAGE.RECALCULATE
    );
    return response.data.data.stats;
  },
};
