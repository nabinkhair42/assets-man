import { apiClient } from "@/config/axios-config";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type { ApiResponse } from "@/types/api";
import type {
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  RefreshResponse,
  UpdateProfileInput,
  ChangePasswordInput,
  UpdateProfileResponse,
  SendOtpInput,
  VerifyOtpInput,
  SendOtpResponse,
} from "@/types/auth";
import type { StorageStats } from "@/types/storage";

export interface MeResponse {
  user: User;
  storageStats: StorageStats | null;
}

export const authService = {
  async sendRegistrationOtp(input: SendOtpInput): Promise<SendOtpResponse> {
    const response = await apiClient.post<ApiResponse<SendOtpResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_SEND_OTP,
      input
    );
    return response.data.data;
  },

  async verifyRegistrationOtp(input: VerifyOtpInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP,
      input
    );
    return response.data.data;
  },

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

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  },

  async resendVerification(email: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
  },

  async updateProfile(data: UpdateProfileInput): Promise<UpdateProfileResponse> {
    const response = await apiClient.patch<ApiResponse<UpdateProfileResponse>>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );
    return response.data.data;
  },

  async changePassword(data: ChangePasswordInput): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, {
      data: { password },
    });
  },
};
