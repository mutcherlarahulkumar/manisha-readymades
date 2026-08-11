/**
 * Banner model. Visibility is the conjunction of `isActive` and an optional
 * date window, so a banner can be scheduled ahead of time.
 *
 * @module models/Banner
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { imageAssetSchema } from '@/models/shared';
import { BANNER_POSITIONS, type BannerPosition, type ImageAsset } from '@/types/models';

/** Persisted shape of a banner. */
export interface BannerDocument {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  image: ImageAsset;
  link?: string;
  position: BannerPosition;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<BannerDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [80, 'Title must be 80 characters or fewer'],
    },
    subtitle: { type: String, trim: true, maxlength: 160 },
    image: { type: imageAssetSchema, required: [true, 'Banner image is required'] },
    link: { type: String, trim: true, maxlength: 500 },
    position: { type: String, enum: BANNER_POSITIONS, required: true, default: 'top', index: true },
    sortOrder: { type: Number, required: true, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

/** Rejects an end date that precedes the start date. */
bannerSchema.pre('validate', function validateWindow(next) {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'End date must be after the start date');
  }
  next();
});

bannerSchema.index({ isActive: 1, position: 1, sortOrder: 1 });

/** Mongoose model for banners. */
export const Banner: Model<BannerDocument> =
  (mongoose.models.Banner as Model<BannerDocument>) ??
  mongoose.model<BannerDocument>('Banner', bannerSchema);
