/**
 * Customer review model. Reviews are text-only by design — no image uploads —
 * and are held in `pending` until an admin approves them.
 *
 * @module models/Review
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { REVIEW_STATUSES, type ReviewStatus } from '@/types/models';

/** Persisted shape of a review. */
export interface ReviewDocument {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customerName: {
      type: String,
      required: [true, 'Your name is required'],
      trim: true,
      maxlength: [60, 'Name must be 60 characters or fewer'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    comment: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [1000, 'Review must be 1000 characters or fewer'],
    },
    status: { type: String, enum: REVIEW_STATUSES, required: true, default: 'pending', index: true },
  },
  { timestamps: true },
);

// Moderation queue and per-product approved listing.
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, status: 1 });

/** Mongoose model for reviews. */
export const Review: Model<ReviewDocument> =
  (mongoose.models.Review as Model<ReviewDocument>) ??
  mongoose.model<ReviewDocument>('Review', reviewSchema);
