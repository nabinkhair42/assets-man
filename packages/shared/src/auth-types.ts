// User types (safe to expose to client)
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

// Auth request types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

// JWT Payload
export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
}
