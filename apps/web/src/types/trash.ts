import type { Asset } from "./asset";
import type { Folder } from "./folder";

export type TrashedAsset = Asset & { itemType: "asset" };
export type TrashedFolder = Folder & { itemType: "folder" };
export type TrashedItem = TrashedAsset | TrashedFolder;

export interface ListTrashParams {
  page?: number;
  limit?: number;
}

export interface PaginatedTrash {
  items: TrashedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmptyTrashResult {
  deletedAssets: number;
  deletedFolders: number;
  total: number;
}
