import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type { ApiResponse } from "@/types/api";
import type {
  Share,
  ShareWithDetails,
  CreateUserShareInput,
  CreateLinkShareInput,
  UpdateShareInput,
  AccessLinkShareInput,
  LinkShareAccess,
  SharedItemDetails,
  SharedAssetDownload,
  SharedFolderContents,
} from "@/types/share";

export const shareService = {
  async createUserShare(input: CreateUserShareInput): Promise<Share> {
    const response = await apiClient.post<ApiResponse<{ share: Share }>>(
      API_ENDPOINTS.SHARES.CREATE_USER,
      input
    );
    return response.data.data.share;
  },

  async createLinkShare(input: CreateLinkShareInput): Promise<Share> {
    const response = await apiClient.post<ApiResponse<{ share: Share }>>(
      API_ENDPOINTS.SHARES.CREATE_LINK,
      input
    );
    return response.data.data.share;
  },

  async listMyShares(): Promise<ShareWithDetails[]> {
    const response = await apiClient.get<ApiResponse<{ shares: ShareWithDetails[] }>>(
      API_ENDPOINTS.SHARES.MINE
    );
    return response.data.data.shares;
  },

  async listSharedWithMe(): Promise<ShareWithDetails[]> {
    const response = await apiClient.get<ApiResponse<{ shares: ShareWithDetails[] }>>(
      API_ENDPOINTS.SHARES.SHARED_WITH_ME
    );
    return response.data.data.shares;
  },

  async listSharesForItem(itemType: "folder" | "asset", itemId: string): Promise<ShareWithDetails[]> {
    const response = await apiClient.get<ApiResponse<{ shares: ShareWithDetails[] }>>(
      API_ENDPOINTS.SHARES.BY_ITEM(itemType, itemId)
    );
    return response.data.data.shares;
  },

  async getShare(id: string): Promise<Share> {
    const response = await apiClient.get<ApiResponse<{ share: Share }>>(
      API_ENDPOINTS.SHARES.BY_ID(id)
    );
    return response.data.data.share;
  },

  async updateShare(id: string, input: UpdateShareInput): Promise<Share> {
    const response = await apiClient.patch<ApiResponse<{ share: Share }>>(
      API_ENDPOINTS.SHARES.BY_ID(id),
      input
    );
    return response.data.data.share;
  },

  async deleteShare(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SHARES.BY_ID(id));
  },

  async accessLinkShare(token: string, input?: AccessLinkShareInput): Promise<LinkShareAccess> {
    const response = await apiClient.post<ApiResponse<{ share: LinkShareAccess }>>(
      API_ENDPOINTS.SHARES.ACCESS_LINK(token),
      input ?? {}
    );
    return response.data.data.share;
  },

  async getLinkShareDetails(token: string): Promise<SharedItemDetails> {
    const response = await apiClient.get<ApiResponse<SharedItemDetails>>(
      API_ENDPOINTS.SHARES.LINK_DETAILS(token)
    );
    return response.data.data;
  },

  async downloadSharedAsset(token: string, password?: string): Promise<SharedAssetDownload> {
    const response = await apiClient.post<ApiResponse<SharedAssetDownload>>(
      API_ENDPOINTS.SHARES.LINK_DOWNLOAD(token),
      password ? { password } : {}
    );
    return response.data.data;
  },

  generateShareLink(token: string): string {
    return `${window.location.origin}/share/public/${token}`;
  },

  async getSharedFolderContents(
    token: string,
    folderId?: string,
    password?: string
  ): Promise<SharedFolderContents> {
    const params = new URLSearchParams();
    if (folderId) params.set("folderId", folderId);
    if (password) params.set("password", password);

    const url = `${API_ENDPOINTS.SHARES.LINK_FOLDER(token)}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<ApiResponse<SharedFolderContents>>(url);
    return response.data.data;
  },

  async downloadSharedFolderAsset(
    token: string,
    assetId: string,
    password?: string
  ): Promise<SharedAssetDownload> {
    const response = await apiClient.post<ApiResponse<SharedAssetDownload>>(
      API_ENDPOINTS.SHARES.LINK_FOLDER_ASSET(token, assetId),
      password ? { password } : {}
    );
    return response.data.data;
  },

  async downloadSharedFolderZip(
    token: string,
    folderId?: string,
    password?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (folderId) params.set("folderId", folderId);
    if (password) params.set("password", password);

    const url = `${API_ENDPOINTS.SHARES.LINK_FOLDER_DOWNLOAD(token)}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get(url, { responseType: "blob" });
    return response.data;
  },
};
