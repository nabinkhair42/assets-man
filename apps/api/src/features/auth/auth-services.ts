import { eq } from "drizzle-orm";
import { createDb, users, sessions, type User } from "@repo/database";
import type { UserPublic, AuthResponse, AuthTokens } from "@repo/shared";
import { config } from "@/config/env.js";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "@/utils/auth-utils.js";
import type { RegisterInput, LoginInput } from "@/schema/auth-schema.js";

const db = createDb(config.DATABASE_URL);

function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt.toISOString(),
  };
}

function createTokens(userId: string, email: string): AuthTokens {
  return {
    accessToken: generateAccessToken(userId, email),
    expiresIn: 15 * 60, // 15 minutes
  };
}

export async function register(
  input: RegisterInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResponse> {
  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Create user
  const passwordHash = await hashPassword(input.password);
  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name ?? null,
    })
    .returning();

  if (!newUser) {
    throw new Error("INTERNAL_ERROR");
  }

  // Create session
  const refreshToken = generateRefreshToken(newUser.id);
  await db.insert(sessions).values({
    userId: newUser.id,
    refreshToken,
    userAgent: userAgent ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    user: toUserPublic(newUser),
    tokens: createTokens(newUser.id, newUser.email),
  };
}

export async function login(
  input: LoginInput,
  userAgent?: string,
  ipAddress?: string
): Promise<{ response: AuthResponse; refreshToken: string }> {
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Create session
  const refreshToken = generateRefreshToken(user.id);
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    userAgent: userAgent ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    response: {
      user: toUserPublic(user),
      tokens: createTokens(user.id, user.email),
    },
    refreshToken,
  };
}

export async function refresh(
  refreshToken: string
): Promise<{ tokens: AuthTokens; newRefreshToken: string }> {
  // Verify token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error("INVALID_TOKEN");
  }

  // Find session
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.refreshToken, refreshToken),
    with: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  // Delete old session
  await db.delete(sessions).where(eq(sessions.id, session.id));

  // Create new session
  const newRefreshToken = generateRefreshToken(session.userId);
  await db.insert(sessions).values({
    userId: session.userId,
    refreshToken: newRefreshToken,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    tokens: createTokens(session.userId, session.user.email),
    newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
}

export async function logoutAll(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getUserById(userId: string): Promise<UserPublic | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user ? toUserPublic(user) : null;
}
