/**
 * Request validation helpers.
 *
 * All validation goes through the shared Yup schemas in `validation/`, so the
 * server enforces exactly the rules the client form displays.
 *
 * @module lib/api/validate
 */
import { isValidObjectId } from 'mongoose';
import type { AnyObjectSchema, InferType } from 'yup';

import { ApiError } from '@/lib/api/ApiError';

/**
 * Validates and casts a request body against a Yup schema.
 *
 * @param schema - The Yup object schema to validate against.
 * @param body - Raw request body.
 * @returns The validated, typed and stripped value.
 * @throws {ValidationError} Converted to a 400 with field details by the handler.
 */
export async function validateBody<TSchema extends AnyObjectSchema>(
  schema: TSchema,
  body: unknown,
): Promise<InferType<TSchema>> {
  return schema.validate(body ?? {}, {
    abortEarly: false,
    stripUnknown: true,
  }) as Promise<InferType<TSchema>>;
}

/**
 * Validates a query string against a Yup schema, coercing scalars as declared.
 *
 * @param schema - The Yup object schema describing the query.
 * @param query - `req.query` from Next.js.
 * @returns The validated, typed query object.
 */
export async function validateQuery<TSchema extends AnyObjectSchema>(
  schema: TSchema,
  query: unknown,
): Promise<InferType<TSchema>> {
  return schema.validate(query ?? {}, {
    abortEarly: false,
    stripUnknown: true,
  }) as Promise<InferType<TSchema>>;
}

/**
 * Extracts a route parameter and asserts that it is a valid MongoDB ObjectId.
 *
 * Never trust a client-supplied id: an invalid id must produce a 400 rather
 * than surfacing a driver `CastError`.
 *
 * @param value - The raw route parameter (`req.query.id`).
 * @param name - Parameter name, used in the error message.
 * @returns The validated id string.
 * @throws {ApiError} 400 when the value is missing or not a valid ObjectId.
 */
export function requireObjectId(value: unknown, name = 'id'): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${name}`);
  }
  return id;
}

/**
 * Extracts a required string route parameter (for example a slug).
 *
 * @param value - The raw route parameter.
 * @param name - Parameter name, used in the error message.
 * @returns The trimmed parameter value.
 * @throws {ApiError} 400 when the parameter is absent or blank.
 */
export function requireParam(value: unknown, name: string): string {
  const param = Array.isArray(value) ? value[0] : value;
  if (typeof param !== 'string' || param.trim() === '') {
    throw ApiError.badRequest(`Missing ${name}`);
  }
  return param.trim();
}
