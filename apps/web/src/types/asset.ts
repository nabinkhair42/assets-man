export interface Asset {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  thumbnailKey: string | null;
  folderId: string | null;
  ownerId: string;
  isStarred: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestUploadInput {
  fileName: string;
  mimeType: string;
  size: number;
  folderId?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  asset: Asset;
}

export interface UpdateAssetInput {
  name?: string;
  folderId?: string | null;
}

export interface ListAssetsParams {
  folderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAssets {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DownloadUrlResponse {
  url: string;
  asset: Asset;
}
