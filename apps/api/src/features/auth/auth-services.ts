import { eq } from "drizzle-orm";
import crypto from "crypto";
import { createDb, users, sessions, type User } from "@repo/database";
import type { UserPublic, AuthResponse, AuthTokens } from "@repo/shared";
import { createMailClient, type MailClient } from "@repo/mail";
import { config, getMailConfig } from "@/config/env.js";
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

// Password reset constants
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

// Get mail client (singleton)
let mailClient: MailClient | null = null;
function getMailClient(): MailClient | null {
  if (!mailClient) {
    const mailConfig = getMailConfig();
    if (mailConfig) {
      mailClient = createMailClient(mailConfig);
    }
  }
  return mailClient;
}

// Generate a secure random token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Return error if user not found
  if (!user) {
    return { success: false, message: "No account found with this email address" };
  }

  // Check if user has a password (not OAuth-only)
  if (!user.passwordHash) {
    return { success: false, message: "This account uses social login. Please sign in with your social provider." };
  }

  // Generate reset token and expiry
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  // Save token to database
  await db
    .update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send email
  const mail = getMailClient();
  if (!mail) {
    console.error("Mail client not configured - cannot send password reset email");
    return { success: false, message: "Email service not configured" };
  }

  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;
  const result = await mail.sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    userName: user.name ?? undefined,
    expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
  });

  if (!result.success) {
    console.error("Failed to send password reset email:", result.error);
    return { success: false, message: "Failed to send reset email. Please try again later." };
  }

  return { success: true, message: "Password reset email sent successfully" };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // Find user by reset token
  const user = await db.query.users.findFirst({
    where: eq(users.passwordResetToken, token),
  });

  if (!user) {
    return { success: false, message: "Invalid or expired reset token" };
  }

  // Check if token is expired
  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return { success: false, message: "Reset token has expired" };
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear reset token
  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Invalidate all existing sessions for security
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  return { success: true, message: "Password reset successfully" };
}
