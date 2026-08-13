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
  image?: ImageAsset;
  link?: string;
  ctaLabel?: string;
  position: BannerPosition;
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
    // Optional at the schema level: only the hero slot has a picture, and the
    // rule is enforced per position in the hook below.
    image: { type: imageAssetSchema, required: false },
    link: { type: String, trim: true, maxlength: 500 },
    ctaLabel: { type: String, trim: true, maxlength: 24 },
    position: { type: String, enum: BANNER_POSITIONS, required: true, default: 'top', index: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

/**
 * Enforces the rules that depend on which slot the banner fills.
 *
 * The hero is a picture and cannot exist without one. The announcement bar is a
 * line of text, so any image on it is dropped rather than quietly stored — a
 * field nothing renders is how the old "promotional block" became a dead end.
 * A button label without a destination is likewise rejected, since it would
 * render a control that goes nowhere.
 */
bannerSchema.pre('validate', function validateSlot(next) {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'End date must be after the start date');
  }

  if (this.position === 'hero' && !this.image?.url) {
    this.invalidate('image', 'The hero needs an image');
  }

  if (this.position === 'top') {
    this.image = undefined;
    if (this.ctaLabel && !this.link) {
      this.invalidate('link', 'A button needs a destination');
    }
    if (this.link && !this.ctaLabel) {
      this.invalidate('ctaLabel', 'Give the button a label');
    }
  }

  next();
});

// At most one banner per slot, enforced by the database rather than by
// convention, so a second one cannot be created by a concurrent request.
bannerSchema.index({ position: 1 }, { unique: true });

/** Mongoose model for banners. */
export const Banner: Model<BannerDocument> =
  (mongoose.models.Banner as Model<BannerDocument>) ??
  mongoose.model<BannerDocument>('Banner', bannerSchema);
