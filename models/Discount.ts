/**
 * Discount model.
 *
 * Discounts are never written onto products; they are resolved at read time by
 * `services/pricing.service`, so activating, expiring or deleting a discount
 * takes effect immediately with no backfill.
 *
 * @module models/Discount
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { DISCOUNT_SCOPES, DISCOUNT_TYPES, type DiscountScope, type DiscountType } from '@/types/models';

/** Persisted shape of a discount rule. */
export interface DiscountDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  scope: DiscountScope;
  /** Category, brand or product ids depending on `scope`. Empty when scope is `all`. */
  targetIds: Types.ObjectId[];
  type: DiscountType;
  value: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<DiscountDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [80, 'Title must be 80 characters or fewer'],
    },
    description: { type: String, trim: true, maxlength: 300 },
    scope: { type: String, enum: DISCOUNT_SCOPES, required: true, default: 'all' },
    targetIds: { type: [Schema.Types.ObjectId], default: [] },
    type: { type: String, enum: DISCOUNT_TYPES, required: true, default: 'percent' },
    value: { type: Number, required: [true, 'Discount value is required'], min: 1 },
    startsAt: { type: Date, required: [true, 'Start date is required'] },
    endsAt: { type: Date, required: [true, 'End date is required'] },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true },
);

/** Enforces the invariants that span multiple fields. */
discountSchema.pre('validate', function validateInvariants(next) {
  if (this.endsAt && this.startsAt && this.endsAt <= this.startsAt) {
    this.invalidate('endsAt', 'End date must be after the start date');
  }
  if (this.type === 'percent' && this.value > 90) {
    this.invalidate('value', 'Percentage discount cannot exceed 90%');
  }
  if (this.scope !== 'all' && this.targetIds.length === 0) {
    this.invalidate('targetIds', 'Select at least one target for this discount');
  }
  if (this.scope === 'all') {
    this.targetIds = [];
  }
  next();
});

// Resolving active discounts is a hot path on every product listing.
discountSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

/** Mongoose model for discounts. */
export const Discount: Model<DiscountDocument> =
  (mongoose.models.Discount as Model<DiscountDocument>) ??
  mongoose.model<DiscountDocument>('Discount', discountSchema);
