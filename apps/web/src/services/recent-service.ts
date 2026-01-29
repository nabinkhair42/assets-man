import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  RecentItem,
  RecordAccessInput,
  PaginatedRecentItems,
} from "@/types/recent";

export const recentService = {
  async list(params?: { page?: number; limit?: number }): Promise<PaginatedRecentItems> {
    const response = await apiClient.get<PaginatedResponse<RecentItem>>(
      API_ENDPOINTS.RECENT.BASE,
      { params }
    );
    return {
      items: response.data.data,
      ...response.data.pagination,
    };
  },

  async recordAccess(input: RecordAccessInput): Promise<void> {
    await apiClient.post(API_ENDPOINTS.RECENT.BASE, input);
  },

  async clearHistory(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.RECENT.BASE);
  },

  async removeFromRecent(id: string, itemType: "asset" | "folder"): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.RECENT.REMOVE(id), {
      params: { itemType },
    });
  },
};
