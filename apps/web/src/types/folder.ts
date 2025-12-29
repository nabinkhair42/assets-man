import type { SortOrder } from "./asset";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  isStarred: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number; // Present in search results
}

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name?: string;
}

export interface MoveFolderInput {
  parentId: string | null;
}

export type FolderSortBy = "name" | "createdAt" | "updatedAt";

export interface FolderContentsParams {
  parentId?: string | null;
  sortBy?: FolderSortBy;
  sortOrder?: SortOrder;
}

export interface CopyFolderInput {
  targetParentId?: string | null;
}

export interface CopyFolderResult {
  folder: Folder;
  assetsCopied: number;
  foldersCopied: number;
}
