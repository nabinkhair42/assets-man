import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { AUTH_CONSTANTS, type JwtPayload } from "@repo/shared";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, email: string): string {
  const payload = { sub: userId, email };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(userId: string): string {
  const payload = { sub: userId };
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(
  token: string
): { sub: string } | null {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000);
}
