/**
 * Route-handler composition utilities.
 *
 * `createHandler` maps HTTP methods to typed handlers, normalises every thrown
 * error into the shared failure envelope, and keeps route files free of
 * try/catch and status-code plumbing.
 *
 * @module lib/api/handler
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { ValidationError } from 'yup';

import { ApiError, type FieldErrors } from '@/lib/api/ApiError';
import { connectToDatabase } from '@/lib/mongodb';
import type { ApiFailure, ApiResponse, PaginationMeta } from '@/types/api';

/** HTTP methods supported by the API layer. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A single method handler. Throw {@link ApiError} to produce a non-2xx response. */
export type MethodHandler = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>,
) => Promise<void> | void;

/** Map of HTTP method to its handler. Unlisted methods yield 405. */
export type MethodMap = Partial<Record<HttpMethod, MethodHandler>>;

/**
 * Sends a success envelope.
 *
 * @param res - The Next.js response object.
 * @param data - Payload to return under `data`.
 * @param status - HTTP status code, defaults to 200.
 * @param meta - Optional pagination metadata.
 */
export function sendSuccess<TData>(
  res: NextApiResponse<ApiResponse<TData>>,
  data: TData,
  status = 200,
  meta?: PaginationMeta,
): void {
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}

/**
 * Translates an unknown thrown value into a client-safe failure envelope.
 *
 * Recognised cases: {@link ApiError}, Yup `ValidationError` (400), Mongoose
 * `ValidationError` (400), Mongoose `CastError` (400) and duplicate-key write
 * errors (409). Everything else becomes an opaque 500.
 *
 * @param error - The thrown value.
 * @returns The status code and body to send.
 */
export function toFailureResponse(error: unknown): { status: number; body: ApiFailure } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        success: false,
        error: error.details
          ? { message: error.message, details: error.details }
          : { message: error.message },
      },
    };
  }

  if (error instanceof ValidationError) {
    const details: FieldErrors = {};
    for (const inner of error.inner.length > 0 ? error.inner : [error]) {
      if (inner.path && !details[inner.path]) details[inner.path] = inner.message;
    }
    return {
      status: 400,
      body: { success: false, error: { message: 'Validation failed', details } },
    };
  }

  if (isMongoDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0];
    return {
      status: 409,
      body: {
        success: false,
        error: {
          message: field
            ? `A record with this ${humaniseKey(field)} already exists`
            : 'A record with these details already exists',
        },
      },
    };
  }

  if (isMongooseError(error, 'ValidationError')) {
    return { status: 400, body: { success: false, error: { message: 'Validation failed' } } };
  }

  if (isMongooseError(error, 'CastError')) {
    return { status: 400, body: { success: false, error: { message: 'Invalid identifier' } } };
  }

  // Unexpected: log server-side only, return an opaque message.
  console.error('[api] Unhandled error:', error);
  return {
    status: 500,
    body: { success: false, error: { message: 'Something went wrong. Please try again.' } },
  };
}

/**
 * Builds a Next.js API route handler from a method map.
 *
 * Connects to MongoDB before dispatching and converts any thrown error into the
 * standard failure envelope.
 *
 * @param methods - Map of HTTP method to handler.
 * @returns A Next.js API route handler.
 *
 * @example
 * ```ts
 * export default createHandler({
 *   GET: async (req, res) => sendSuccess(res, await listProducts(req.query)),
 *   POST: withAuth(async (req, res, admin) => { ... }),
 * });
 * ```
 */
export function createHandler(methods: MethodMap) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<unknown>>,
  ): Promise<void> {
    const method = (req.method ?? 'GET') as HttpMethod;
    const methodHandler = methods[method];

    if (!methodHandler) {
      res.setHeader('Allow', Object.keys(methods).join(', '));
      res.status(405).json({
        success: false,
        error: { message: `Method ${method} is not allowed on this endpoint` },
      });
      return;
    }

    try {
      await connectToDatabase();
      await methodHandler(req, res);
    } catch (error) {
      const { status, body } = toFailureResponse(error);
      if (!res.writableEnded) res.status(status).json(body);
    }
  };
}

/** Narrow shape of a MongoDB duplicate-key write error. */
interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, unknown>;
}

/** Type guard for MongoDB duplicate-key (E11000) errors. */
function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

/** Type guard matching a Mongoose error by its `name`. */
function isMongooseError(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && (error as Error).name === name;
}

/** Converts an index key such as `nameLower` into user-facing wording. */
function humaniseKey(key: string): string {
  return key
    .replace(/Lower$/, '')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
}
