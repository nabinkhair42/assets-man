import type { Asset } from "./asset";
import type { Folder } from "./folder";

export interface RecentItem {
  id: string;
  itemType: "asset" | "folder";
  accessedAt: string;
  asset?: Asset;
  folder?: Folder;
}

export interface RecordAccessInput {
  itemId: string;
  itemType: "asset" | "folder";
}

export interface PaginatedRecentItems {
  items: RecentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
