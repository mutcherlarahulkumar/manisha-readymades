/**
 * Admin authentication: password hashing and stateless JWT bearer tokens.
 *
 * The token is returned by `/api/auth/login` and stored by the browser; every
 * subsequent admin request presents it as `Authorization: Bearer <token>`.
 * Nothing is stored server-side, so logout is purely a client-side discard —
 * tokens remain valid until they expire.
 *
 * @module lib/auth
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { GetServerSidePropsContext, NextApiRequest } from 'next';

import { ApiError } from '@/lib/api/ApiError';
import { serverEnv } from '@/lib/env';
import type { AdminRole } from '@/types/models';

/** Token lifetime in seconds (7 days). */
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

/** Claims embedded in the admin bearer token. */
export interface SessionPayload {
  /** Admin document id. */
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Hashes a plaintext password with bcrypt.
 *
 * @param password - The plaintext password.
 * @returns The bcrypt hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifies a plaintext password against a bcrypt hash in constant time.
 *
 * @param password - Candidate plaintext password.
 * @param hash - Stored bcrypt hash.
 * @returns Whether the password matches.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a bearer token for an authenticated admin.
 *
 * @param payload - Claims to embed.
 * @returns The signed JWT.
 */
export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, serverEnv.jwtSecret, { expiresIn: TOKEN_MAX_AGE });
}

/**
 * Extracts the bearer token from an incoming request's `Authorization` header.
 *
 * @param req - An API request or `getServerSideProps` request.
 * @returns The raw token, or `null` when the header is absent or malformed.
 */
function readBearerToken(
  req: NextApiRequest | GetServerSidePropsContext['req'],
): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Reads and verifies the admin token on an incoming request.
 *
 * @param req - An API request or `getServerSideProps` request.
 * @returns The token claims, or `null` when absent, malformed or expired.
 */
export function getSession(
  req: NextApiRequest | GetServerSidePropsContext['req'],
): SessionPayload | null {
  const token = readBearerToken(req);
  if (!token) return null;

  try {
    return jwt.verify(token, serverEnv.jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Returns the verified claims for the current request, or throws 401.
 *
 * @param req - The incoming API request.
 * @returns The verified token claims.
 * @throws {ApiError} 401 when no valid token is present.
 */
export function requireSession(req: NextApiRequest): SessionPayload {
  const session = getSession(req);
  if (!session) throw ApiError.unauthorized();
  return session;
}

/**
 * Returns the verified claims, asserting they carry one of the allowed roles.
 *
 * @param req - The incoming API request.
 * @param roles - Roles permitted to perform the action.
 * @returns The verified token claims.
 * @throws {ApiError} 401 when unauthenticated, 403 when the role is insufficient.
 */
export function requireRole(req: NextApiRequest, roles: readonly AdminRole[]): SessionPayload {
  const session = requireSession(req);
  if (!roles.includes(session.role)) throw ApiError.forbidden();
  return session;
}
