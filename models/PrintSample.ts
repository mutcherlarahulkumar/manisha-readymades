/**
 * Custom printing sample model.
 *
 * Photographs of work already done — printed t-shirts, uniforms, campaign
 * wear — with a line about each. Kept apart from the catalogue because these
 * are not stock: nothing here has a SKU, a price or sizes, and none of it can
 * be ordered as-is. It exists to show a prospective customer what the printing
 * actually looks like before they ask for a quote.
 *
 * @module models/PrintSample
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { imageAssetSchema } from '@/models/shared';
import type { ImageAsset } from '@/types/models';

/** Persisted shape of a printing sample. */
export interface PrintSampleDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  image: ImageAsset;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const printSampleSchema = new Schema<PrintSampleDocument>(
  {
    title: {
      type: String,
      required: [true, 'A title is required'],
      trim: true,
      maxlength: [80, 'Title must be 80 characters or fewer'],
    },
    description: { type: String, trim: true, maxlength: 300 },
    image: { type: imageAssetSchema, required: [true, 'A photo is required'] },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

printSampleSchema.index({ isActive: 1, sortOrder: 1 });

/** Mongoose model for custom printing samples. */
export const PrintSample: Model<PrintSampleDocument> =
  (mongoose.models.PrintSample as Model<PrintSampleDocument>) ??
  mongoose.model<PrintSampleDocument>('PrintSample', printSampleSchema);
