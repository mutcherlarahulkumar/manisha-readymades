/**
 * Wholesale catalogue model.
 *
 * A single document holding the PDF a retailer downloads. Modelled as a
 * collection with a one-row constraint rather than as a config file, because
 * the owner replaces it from the admin whenever the range changes and a
 * redeploy should not be part of that.
 *
 * @module models/Catalogue
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { imageAssetSchema } from '@/models/shared';
import type { ImageAsset } from '@/types/models';

/**
 * The fixed value of {@link CatalogueDocument.singleton}.
 *
 * @remarks
 * Carrying a unique index, this is what makes the collection hold exactly one
 * catalogue. Uploading a replacement upserts on this key, so there is never a
 * second row to pick between and no "which one is live?" to get wrong.
 */
export const CATALOGUE_KEY = 'current';

/** Persisted shape of the catalogue. */
export interface CatalogueDocument {
  _id: Types.ObjectId;
  singleton: string;
  file: ImageAsset;
  /** Shown beside the download button, e.g. "Autumn 2026 range". */
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

const catalogueSchema = new Schema<CatalogueDocument>(
  {
    singleton: {
      type: String,
      required: true,
      unique: true,
      default: CATALOGUE_KEY,
      enum: [CATALOGUE_KEY],
    },
    file: { type: imageAssetSchema, required: [true, 'A catalogue file is required'] },
    label: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true },
);

/** Mongoose model for the wholesale catalogue. */
export const Catalogue: Model<CatalogueDocument> =
  (mongoose.models.Catalogue as Model<CatalogueDocument>) ??
  mongoose.model<CatalogueDocument>('Catalogue', catalogueSchema);
