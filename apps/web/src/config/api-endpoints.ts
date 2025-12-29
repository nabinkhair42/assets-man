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
    SEARCH: "/api/folders/search",
    MOVE: (id: string) => `/api/folders/${id}/move`,
    STAR: (id: string) => `/api/folders/${id}/star`,
    STARRED: "/api/folders/starred",
    COPY: (id: string) => `/api/folders/${id}/copy`,
  },

  // Assets
  ASSETS: {
    BASE: "/api/assets",
    BY_ID: (id: string) => `/api/assets/${id}`,
    UPLOAD: "/api/assets/upload",
    DOWNLOAD: (id: string) => `/api/assets/${id}/download`,
    SHARED_DOWNLOAD: (id: string) => `/api/assets/${id}/shared-download`,
    STAR: (id: string) => `/api/assets/${id}/star`,
    STARRED: "/api/assets/starred",
    COPY: (id: string) => `/api/assets/${id}/copy`,
    BULK_DOWNLOAD: "/api/assets/bulk-download",
  },

  // Trash
  TRASH: {
    BASE: "/api/trash",
    RESTORE: (id: string) => `/api/trash/${id}/restore`,
    PERMANENT_DELETE: (id: string) => `/api/trash/${id}`,
  },

  // Recent
  RECENT: {
    BASE: "/api/recent",
    REMOVE: (id: string) => `/api/recent/${id}`,
  },

  // Shares
  SHARES: {
    CREATE_USER: "/api/shares/user",
    CREATE_LINK: "/api/shares/link",
    MINE: "/api/shares/mine",
    SHARED_WITH_ME: "/api/shares/shared-with-me",
    BY_ITEM: (itemType: string, itemId: string) => `/api/shares/item/${itemType}/${itemId}`,
    BY_ID: (id: string) => `/api/shares/${id}`,
    ACCESS_LINK: (token: string) => `/api/shares/link/${token}/access`,
    LINK_DETAILS: (token: string) => `/api/shares/link/${token}/details`,
    LINK_DOWNLOAD: (token: string) => `/api/shares/link/${token}/download`,
  },
} as const;
