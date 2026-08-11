/**
 * Brand model. Brand names are unique case-insensitively via `nameLower`.
 *
 * @module models/Brand
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { imageAssetSchema, normaliseName, slugify } from '@/models/shared';
import type { ImageAsset } from '@/types/models';

/** Persisted shape of a brand. */
export interface BrandDocument {
  _id: Types.ObjectId;
  name: string;
  /** Lowercased mirror of `name`, enforcing case-insensitive uniqueness. */
  nameLower: string;
  slug: string;
  logo?: ImageAsset;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<BrandDocument>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      maxlength: [60, 'Brand name must be 60 characters or fewer'],
    },
    nameLower: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: imageAssetSchema, default: undefined },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

/** Keeps `nameLower` and `slug` in sync with `name` on every write. */
brandSchema.pre('validate', function syncDerivedFields(next) {
  if (this.isModified('name') && typeof this.name === 'string') {
    this.nameLower = normaliseName(this.name);
    this.slug = slugify(this.name);
  }
  next();
});

/** Mongoose model for brands. */
export const Brand: Model<BrandDocument> =
  (mongoose.models.Brand as Model<BrandDocument>) ??
  mongoose.model<BrandDocument>('Brand', brandSchema);
