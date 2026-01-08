import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type {
  ApiResponse,
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  RefreshResponse,
  StorageStats,
} from "@/types";

export interface MeResponse {
  user: User;
  storageStats: StorageStats | null;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      input
    );
    return response.data.data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      input
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>(
      API_ENDPOINTS.AUTH.REFRESH
    );
    return response.data.data;
  },

  async getMe(): Promise<MeResponse> {
    const response = await apiClient.get<ApiResponse<MeResponse>>(
      API_ENDPOINTS.AUTH.ME
    );
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
  },
};
