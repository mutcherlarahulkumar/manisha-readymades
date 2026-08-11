/**
 * Category model supporting one level of nesting (e.g. Men's Wear → T-Shirts →
 * Round-neck T-Shirts is modelled as a self-referencing `parent` chain).
 *
 * Names are unique case-insensitively via the derived `nameLower` field, which
 * carries the unique index.
 *
 * @module models/Category
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { imageAssetSchema, normaliseName, slugify } from '@/models/shared';
import type { ImageAsset } from '@/types/models';

/** Persisted shape of a category. */
export interface CategoryDocument {
  _id: Types.ObjectId;
  name: string;
  /** Lowercased mirror of `name`, enforcing case-insensitive uniqueness. */
  nameLower: string;
  slug: string;
  parent: Types.ObjectId | null;
  description?: string;
  image?: ImageAsset;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [60, 'Category name must be 60 characters or fewer'],
    },
    nameLower: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: imageAssetSchema, default: undefined },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

/** Keeps `nameLower` and `slug` in sync with `name` on every write. */
categorySchema.pre('validate', function syncDerivedFields(next) {
  if (this.isModified('name') && typeof this.name === 'string') {
    this.nameLower = normaliseName(this.name);
    this.slug = slugify(this.name);
  }
  next();
});

categorySchema.index({ isActive: 1, sortOrder: 1 });

/** Mongoose model for categories. */
export const Category: Model<CategoryDocument> =
  (mongoose.models.Category as Model<CategoryDocument>) ??
  mongoose.model<CategoryDocument>('Category', categorySchema);
