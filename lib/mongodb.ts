/**
 * MongoDB connection management for a serverless runtime.
 *
 * Each serverless invocation may reuse a warm Node process, so the Mongoose
 * connection (and the in-flight connection promise) are cached on `globalThis`.
 * Without this, every request would open a new pool and quickly exhaust the
 * Atlas connection limit.
 *
 * @module lib/mongodb
 */
import mongoose, { type Mongoose } from 'mongoose';

import { serverEnv } from '@/lib/env';

/** Shape of the cache stored on the global object. */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cache;

/**
 * Returns a connected Mongoose instance, reusing the cached connection when one
 * already exists. Safe to call at the top of every API handler.
 *
 * @returns The shared, connected Mongoose instance.
 * @throws {Error} When `MONGODB_URI` is missing or the connection fails.
 *
 * @example
 * ```ts
 * await connectToDatabase();
 * const products = await Product.find().lean();
 * ```
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(serverEnv.mongodbUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      } as mongoose.ConnectOptions)
      .catch((error: unknown) => {
        // Reset so a later request can retry instead of reusing a failed promise.
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
