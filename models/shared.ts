/**
 * Schema fragments and helpers shared across models.
 *
 * @module models/shared
 */
import { Schema } from 'mongoose';

import type { ImageAsset } from '@/types/models';

/**
 * Embedded sub-schema for a Cloudinary asset. `publicId` is required so the
 * asset can always be deleted from Cloudinary when the parent is removed.
 */
export const imageAssetSchema = new Schema<ImageAsset>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false },
);

/**
 * Converts a display name into a URL-safe slug.
 *
 * @param value - The source text.
 * @returns A lowercase, hyphenated slug with diacritics and punctuation removed.
 *
 * @example
 * ```ts
 * slugify("Men's Round-neck T-Shirts"); // 'mens-round-neck-t-shirts'
 * ```
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Normalises a name for case-insensitive uniqueness checks.
 *
 * Stored in a dedicated `nameLower` field carrying the unique index, which is
 * more predictable across drivers than a collation-based index.
 *
 * @param value - The display name.
 * @returns The trimmed, lowercased, whitespace-collapsed form.
 */
export function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
