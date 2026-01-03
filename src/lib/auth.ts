import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'dashboard_token';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

// Define role types
export type UserRole = 'ADMIN' | 'SDR' | 'CLIENT';

// JWT payload structure
export interface JWTPayload {
  userId: string;
  role: UserRole;
  clientId?: string;
}

/**
 * Hashes a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT token with user information
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extracts and verifies auth token from request
 * Works with both App Router (NextRequest) and API routes
 */
export async function verifyAuthFromRequest(
  req?: NextRequest
): Promise<JWTPayload> {
  let token: string | undefined;

  if (req) {
    // For API routes with NextRequest
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    // For Server Components and Server Actions
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) {
    throw new Error('No authentication token found');
  }

  return verifyToken(token);
}

/**
 * Requires authentication - throws if user is not authenticated
 */
export async function requireAuth(req?: NextRequest): Promise<JWTPayload> {
  try {
    return await verifyAuthFromRequest(req);
  } catch (error) {
    throw new Error('Unauthorized: ' + (error as Error).message);
  }
}

/**
 * Requires specific role(s) - throws if user doesn't have required role
 */
export async function requireRole(
  allowedRoles: UserRole[],
  req?: NextRequest
): Promise<JWTPayload> {
  const user = await requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: User role '${user.role}' is not allowed. Required: ${allowedRoles.join(' or ')}`
    );
  }

  return user;
}

/**
 * Sets authentication cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clears authentication cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

