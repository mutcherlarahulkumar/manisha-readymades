/**
 * Conversion of Mongoose lean documents into JSON-safe plain objects.
 *
 * `getServerSideProps` cannot return `ObjectId` or `Date` instances, and the
 * browser expects strings, so every document crossing the boundary passes
 * through {@link serialize}.
 *
 * @module lib/serialize
 */
import { Types } from 'mongoose';

/**
 * Recursively converts ObjectIds to hex strings, Dates to ISO strings, and
 * drops `undefined` values so the result is safe for `JSON.stringify` and for
 * Next.js page props.
 *
 * @typeParam TResult - The serialised shape the caller expects.
 * @param value - A lean Mongoose document, array of documents, or plain value.
 * @returns The JSON-safe equivalent.
 *
 * @example
 * ```ts
 * const doc = await Product.findById(id).lean();
 * const product = serialize<Product>(doc);
 * ```
 */
export function serialize<TResult>(value: unknown): TResult {
  return transform(value) as TResult;
}

/** Recursive worker behind {@link serialize}. */
function transform(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Types.ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(transform);

  if (typeof value === 'object') {
    // Buffers and other exotic objects are not expected in our documents.
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      if (key === '__v' || item === undefined) continue;
      result[key] = transform(item);
    }
    return result;
  }

  return value;
}
