export type SharePermission = "view" | "edit";
export type ShareType = "user" | "link";

export interface Share {
  id: string;
  ownerId: string;
  folderId: string | null;
  assetId: string | null;
  shareType: ShareType;
  sharedWithUserId: string | null;
  sharedWithEmail: string | null;
  permission: SharePermission;
  linkToken: string | null;
  linkPassword: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareWithDetails extends Share {
  sharedWithName: string | null;
  ownerName: string | null;
  itemName: string;
  itemType: "folder" | "asset";
  mimeType: string | null;
  size: number | null;
}

export interface CreateUserShareInput {
  folderId?: string;
  assetId?: string;
  email: string;
  permission?: SharePermission;
}

export interface CreateLinkShareInput {
  folderId?: string;
  assetId?: string;
  permission?: SharePermission;
  password?: string;
  expiresIn?: number; // Hours
}

export interface UpdateShareInput {
  permission?: SharePermission;
  password?: string | null;
  expiresIn?: number | null;
}

export interface AccessLinkShareInput {
  password?: string;
}

export interface LinkShareAccess {
  id: string;
  folderId: string | null;
  assetId: string | null;
  permission: SharePermission;
  expiresAt: string | null;
}

export interface SharedItemDetails {
  share: {
    id: string;
    permission: SharePermission;
    expiresAt: string | null;
    requiresPassword: boolean;
    ownerName: string;
  };
  item: {
    id: string;
    name: string;
    type: "folder" | "asset";
    mimeType?: string;
    size?: number;
    createdAt: string;
  };
}

export interface SharedAssetDownload {
  url: string;
  name: string;
}
