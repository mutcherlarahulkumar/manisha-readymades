/**
 * Product model.
 *
 * The `sku` is a sequential business key (`SKL00001`) assigned once on creation
 * from an atomic counter and never reassigned. `slug` is derived from the name
 * and suffixed with the SKU to guarantee uniqueness across identically named
 * products.
 *
 * @module models/Product
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { formatSequence, getNextSequence } from '@/models/Counter';
import { imageAssetSchema, slugify } from '@/models/shared';
import { PRODUCT_STATUSES, SIZES, type ImageAsset, type ProductStatus, type Size } from '@/types/models';

/** Counter name backing the SKU sequence. */
export const SKU_SEQUENCE = 'product_sku';

/** Persisted shape of a product. */
export interface ProductDocument {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  brand: Types.ObjectId | null;
  category: Types.ObjectId;
  colors: string[];
  sizes: Size[];
  images: ImageAsset[];
  price: number;
  status: ProductStatus;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: [/^SKL\d{5,}$/, 'SKU must be in the format SKL00001'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [140, 'Product name must be 140 characters or fewer'],
    },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 2000 },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    colors: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: {
        validator: (values: string[]) => values.length > 0,
        message: 'Select at least one colour',
      },
    },
    sizes: {
      type: [{ type: String, enum: SIZES }],
      default: [],
      validate: {
        validator: (values: string[]) => values.length > 0,
        message: 'Select at least one size',
      },
    },
    images: {
      type: [imageAssetSchema],
      default: [],
      validate: {
        validator: (values: ImageAsset[]) => values.length > 0 && values.length <= 8,
        message: 'Upload between 1 and 8 images',
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least ₹1'],
    },
    status: { type: String, enum: PRODUCT_STATUSES, required: true, default: 'active', index: true },
    isFeatured: { type: Boolean, required: true, default: false, index: true },
    ratingAverage: { type: Number, required: true, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

/**
 * Assigns the next SKU on insert and keeps `slug` aligned with the name.
 * The SKU suffix guarantees slug uniqueness without a retry loop.
 */
productSchema.pre('validate', async function assignKeys(next) {
  if (this.isNew && !this.sku) {
    this.sku = formatSequence('SKL', await getNextSequence(SKU_SEQUENCE));
  }
  if ((this.isNew || this.isModified('name')) && typeof this.name === 'string') {
    this.slug = `${slugify(this.name)}-${this.sku.toLowerCase()}`;
  }
  next();
});

// Storefront listing: filter by visibility then sort by recency or price.
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });
// Free-text search across the fields an admin or visitor would type.
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

/** Mongoose model for products. */
export const Product: Model<ProductDocument> =
  (mongoose.models.Product as Model<ProductDocument>) ??
  mongoose.model<ProductDocument>('Product', productSchema);
