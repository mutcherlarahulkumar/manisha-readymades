/**
 * Atomic sequence counters used to generate human-readable business keys such
 * as product SKUs (`SKL00001`) and order numbers (`ORD00001`).
 *
 * Counting documents would race under concurrent writes; a single-document
 * `$inc` with `upsert` is atomic in MongoDB and therefore collision-free.
 *
 * @module models/Counter
 */
import mongoose, { Schema, type Model } from 'mongoose';

/** A named sequence. */
export interface CounterDocument {
  /** Sequence name, e.g. `product_sku`. */
  _id: string;
  /** Last issued value. */
  seq: number;
}

const counterSchema = new Schema<CounterDocument>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

/** Mongoose model for sequence counters. */
export const Counter: Model<CounterDocument> =
  (mongoose.models.Counter as Model<CounterDocument>) ??
  mongoose.model<CounterDocument>('Counter', counterSchema);

/**
 * Atomically increments a named sequence and returns the new value.
 *
 * @param name - Sequence name.
 * @returns The next value in the sequence, starting at 1.
 */
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return counter?.seq ?? 1;
}

/**
 * Formats a sequence value as a prefixed, zero-padded business key.
 *
 * @param prefix - Literal prefix, e.g. `SKL`.
 * @param value - Sequence value.
 * @param width - Total digits after the prefix, defaults to 5.
 * @returns The formatted key, e.g. `SKL00001`.
 *
 * @example
 * ```ts
 * formatSequence('SKL', 1); // 'SKL00001'
 * formatSequence('SKL', 123456); // 'SKL123456' — grows past the pad width
 * ```
 */
export function formatSequence(prefix: string, value: number, width = 5): string {
  return `${prefix}${String(value).padStart(width, '0')}`;
}
