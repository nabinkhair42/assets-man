export interface StorageStats {
  usedStorage: number;
  quotaLimit: number;
  usedPercentage: number;
  remainingStorage: number;
  formattedUsed: string;
  formattedLimit: string;
  formattedRemaining: string;
}
