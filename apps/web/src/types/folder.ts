export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface FolderContentsParams {
  parentId?: string | null;
}
