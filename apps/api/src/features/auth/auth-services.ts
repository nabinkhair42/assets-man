import { config, getMailConfig } from "@/config/env.js";
import type {
  LoginInput,
  RegisterInput,
  RegisterSendOtpInput,
  RegisterVerifyOtpInput,
  UpdateProfileInput,
} from "@/schema/auth-schema.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
} from "@/utils/auth-utils.js";
import { createDb, sessions, users, pendingRegistrations, type User } from "@repo/database";
import { createMailClient, validateEmailDomain, type MailClient } from "@repo/mail";
import type { AuthResponse, AuthTokens, UserPublic } from "@repo/shared";
import crypto from "crypto";
import { eq, lt } from "drizzle-orm";

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

  // Send verification email (non-blocking)
  sendVerificationEmail(newUser.id).catch((err) => {
    console.error("Failed to send verification email on registration:", err);
  });

  return {
    user: toUserPublic(newUser),
    tokens: createTokens(newUser.id, newUser.email),
  };
}

// --- OTP Registration ---

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  const num = crypto.randomBytes(4).readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, "0");
}

export async function registerSendOtp(
  input: RegisterSendOtpInput
): Promise<{ success: boolean; message: string; email: string }> {
  // Check if email is already taken
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Validate email domain has MX records
  const emailValidation = await validateEmailDomain(input.email);
  if (!emailValidation.valid && emailValidation.reason !== "dns_error") {
    throw new Error("INVALID_EMAIL_DOMAIN");
  }

  // Hash password and generate OTP
  const passwordHash = await hashPassword(input.password);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Upsert pending registration (delete existing + insert new)
  await db
    .delete(pendingRegistrations)
    .where(eq(pendingRegistrations.email, input.email));

  await db.insert(pendingRegistrations).values({
    email: input.email,
    passwordHash,
    name: input.name ?? null,
    otp,
    attempts: 0,
    expiresAt,
  });

  // Send OTP email
  const mail = getMailClient();
  if (!mail) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  const result = await mail.sendOtpEmail({
    to: input.email,
    otp,
    userName: input.name,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });

  if (!result.success) {
    throw new Error("MAIL_SEND_FAILED");
  }

  // Poll email status to catch bounces/suppressions early
  if (result.messageId) {
    const emailId = result.messageId;
    // All non-deliverable statuses from Resend's Email Events:
    // bounced, suppressed, failed, complained, canceled
    // Safe statuses: sent, delivered, opened, clicked, queued, scheduled, delivery_delayed
    const FAILED_STATUSES = new Set(["bounced", "suppressed", "failed", "complained", "canceled"]);

    // Check twice — suppressed emails resolve almost instantly,
    // hard bounces may take a couple seconds
    for (const delay of [1500, 3000]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const statusResult = await mail.getEmailStatus(emailId);
      console.log(`[OTP] Email ${emailId} status after ${delay}ms: ${statusResult.status}`);

      if (statusResult.status && FAILED_STATUSES.has(statusResult.status)) {
        // Clean up the pending registration since email is undeliverable
        await db
          .delete(pendingRegistrations)
          .where(eq(pendingRegistrations.email, input.email));
        throw new Error("EMAIL_BOUNCED");
      }

      // If already delivered/opened, no need to check again
      if (statusResult.status === "delivered" || statusResult.status === "opened") {
        break;
      }
    }
  } else {
    console.warn("[OTP] No messageId returned from sendOtpEmail — cannot verify delivery status");
  }

  // Opportunistic cleanup of expired pending registrations
  db.delete(pendingRegistrations)
    .where(lt(pendingRegistrations.expiresAt, new Date()))
    .catch((err) => {
      console.error("Failed to cleanup expired pending registrations:", err);
    });

  return {
    success: true,
    message: "Verification code sent to your email",
    email: input.email,
  };
}

export async function registerVerifyOtp(
  input: RegisterVerifyOtpInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResponse> {
  // Find pending registration
  const pending = await db.query.pendingRegistrations.findFirst({
    where: eq(pendingRegistrations.email, input.email),
  });

  if (!pending) {
    throw new Error("PENDING_NOT_FOUND");
  }

  // Check expiry
  if (pending.expiresAt < new Date()) {
    throw new Error("OTP_EXPIRED");
  }

  // Check max attempts
  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error("MAX_ATTEMPTS_EXCEEDED");
  }

  // Verify OTP
  if (pending.otp !== input.otp) {
    // Increment attempts
    await db
      .update(pendingRegistrations)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(pendingRegistrations.id, pending.id));
    throw new Error("INVALID_OTP");
  }

  // Re-check email uniqueness (race condition guard)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    await db
      .delete(pendingRegistrations)
      .where(eq(pendingRegistrations.id, pending.id));
    throw new Error("EMAIL_EXISTS");
  }

  // Create user with emailVerified: true
  const [newUser] = await db
    .insert(users)
    .values({
      email: pending.email,
      passwordHash: pending.passwordHash,
      name: pending.name,
      emailVerified: true,
    })
    .returning();

  if (!newUser) {
    throw new Error("INTERNAL_ERROR");
  }

  // Delete pending registration
  await db
    .delete(pendingRegistrations)
    .where(eq(pendingRegistrations.id, pending.id));

  // Create session
  const refreshToken = generateRefreshToken(newUser.id);
  await db.insert(sessions).values({
    userId: newUser.id,
    refreshToken,
    userAgent: userAgent ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt: getRefreshTokenExpiry(),
  });

  // Send welcome email (fire-and-forget)
  const mail = getMailClient();
  if (mail) {
    const loginUrl = `${config.CLIENT_URL}/login`;
    mail.sendWelcomeEmail({
      to: newUser.email,
      userName: newUser.name ?? newUser.email,
      loginUrl,
    }).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });
  }

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

  // Delete old session and create new session in parallel
  const newRefreshToken = generateRefreshToken(session.userId);
  await Promise.all([
    db.delete(sessions).where(eq(sessions.id, session.id)),
    db.insert(sessions).values({
      userId: session.userId,
      refreshToken: newRefreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: getRefreshTokenExpiry(),
    }),
  ]);

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

// Email verification constants
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

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

// --- Email Verification ---

export async function sendVerificationEmail(userId: string): Promise<{ success: boolean; message: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.emailVerified) {
    return { success: false, message: "Email is already verified" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

  await db
    .update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const mail = getMailClient();
  if (!mail) {
    console.error("Mail client not configured - cannot send verification email");
    return { success: false, message: "Email service not configured" };
  }

  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;
  const result = await mail.sendEmailVerificationEmail({
    to: user.email,
    verificationUrl,
    userName: user.name ?? undefined,
    expiresInHours: EMAIL_VERIFICATION_EXPIRY_HOURS,
  });

  if (!result.success) {
    console.error("Failed to send verification email:", result.error);
    return { success: false, message: "Failed to send verification email" };
  }

  return { success: true, message: "Verification email sent" };
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationToken, token),
  });

  if (!user) {
    return { success: false, message: "Invalid or expired verification token" };
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return { success: false, message: "Verification token has expired" };
  }

  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send welcome email after successful verification
  const mail = getMailClient();
  if (mail) {
    const loginUrl = `${config.CLIENT_URL}/login`;
    await mail.sendWelcomeEmail({
      to: user.email,
      userName: user.name ?? user.email,
      loginUrl,
    });
  }

  return { success: true, message: "Email verified successfully" };
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { success: true, message: "If an account exists with this email, a verification email has been sent" };
  }

  if (user.emailVerified) {
    return { success: true, message: "If an account exists with this email, a verification email has been sent" };
  }

  return sendVerificationEmail(user.id);
}

// --- Profile Management ---

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserPublic> {
  const [updated] = await db
    .update(users)
    .set({
      name: data.name,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error("USER_NOT_FOUND");
  }

  return toUserPublic(updated);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.passwordHash) {
    return { success: false, message: "User not found or uses social login" };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Invalidate all sessions (logout all devices)
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  return { success: true, message: "Password changed successfully" };
}

export async function deleteAccount(userId: string, password: string): Promise<{ success: boolean; message: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.passwordHash) {
    return { success: false, message: "User not found or uses social login" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Password is incorrect" };
  }

  // Delete user (cascade will handle related records)
  await db.delete(users).where(eq(users.id, user.id));

  return { success: true, message: "Account deleted successfully" };
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
