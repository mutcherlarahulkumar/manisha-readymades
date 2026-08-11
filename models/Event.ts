/**
 * Analytics event model.
 *
 * Records product views and WhatsApp enquiry clicks so the dashboard can report
 * "most viewed" and "most enquired" products. Documents are intentionally
 * minimal and carry no personal data. A TTL index expires them after 180 days
 * to keep the collection bounded.
 *
 * @module models/Event
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { EVENT_TYPES, type EventType } from '@/types/models';

/** Retention window for raw analytics events, in seconds (180 days). */
const EVENT_TTL_SECONDS = 60 * 60 * 24 * 180;

/** Persisted shape of an analytics event. */
export interface EventDocument {
  _id: Types.ObjectId;
  type: EventType;
  product: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<EventDocument>(
  {
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
  },
  { timestamps: true },
);

eventSchema.index({ type: 1, product: 1, createdAt: -1 });
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: EVENT_TTL_SECONDS });

/** Mongoose model for analytics events. */
export const Event: Model<EventDocument> =
  (mongoose.models.Event as Model<EventDocument>) ??
  mongoose.model<EventDocument>('Event', eventSchema);
