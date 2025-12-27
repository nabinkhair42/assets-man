export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    ME: "/api/auth/me",
  },

  // Folders
  FOLDERS: {
    BASE: "/api/folders",
    BY_ID: (id: string) => `/api/folders/${id}`,
    CONTENTS: "/api/folders/contents",
    MOVE: (id: string) => `/api/folders/${id}/move`,
    STAR: (id: string) => `/api/folders/${id}/star`,
    STARRED: "/api/folders/starred",
  },

  // Assets
  ASSETS: {
    BASE: "/api/assets",
    BY_ID: (id: string) => `/api/assets/${id}`,
    UPLOAD: "/api/assets/upload",
    DOWNLOAD: (id: string) => `/api/assets/${id}/download`,
    STAR: (id: string) => `/api/assets/${id}/star`,
    STARRED: "/api/assets/starred",
  },

  // Trash
  TRASH: {
    BASE: "/api/trash",
    RESTORE: (id: string) => `/api/trash/${id}/restore`,
    PERMANENT_DELETE: (id: string) => `/api/trash/${id}`,
  },
} as const;
