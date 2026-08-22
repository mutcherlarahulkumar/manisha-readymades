/**
 * Retailer application model.
 *
 * A shop owner asking to buy wholesale. Unlike a product enquiry, which is a
 * question the owner answers on WhatsApp and forgets, this is an account
 * request carrying details worth keeping — GST registration, trading state,
 * what the shop stocks — so it is persisted and worked through in the admin
 * rather than living only in a chat thread.
 *
 * @module models/RetailerApplication
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { RETAILER_STATUSES, type RetailerStatus } from '@/types/models';

/** Accepts a 10-digit Indian mobile, with or without the country code. */
const PHONE_PATTERN = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

/**
 * The 15-character GSTIN format: state code, PAN, entity number, 'Z', checksum.
 *
 * @remarks
 * Structural only — it does not prove the number is registered. Verifying that
 * needs the GST portal, which is a decision for whoever reviews the
 * application, not something to block the form on.
 */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

/** Persisted shape of a retailer application. */
export interface RetailerApplicationDocument {
  _id: Types.ObjectId;
  shopName: string;
  ownerName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  state: string;
  gst?: string;
  interests: string[];
  status: RetailerStatus;
  /** Internal note from whoever reviewed it. Never shown to the applicant. */
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const retailerApplicationSchema = new Schema<RetailerApplicationDocument>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [120, 'Shop name must be 120 characters or fewer'],
      index: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      maxlength: [120, 'Owner name must be 120 characters or fewer'],
    },
    phone: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [PHONE_PATTERN, 'Enter a valid 10-digit mobile number'],
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      match: [PHONE_PATTERN, 'Enter a valid 10-digit WhatsApp number'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [80, 'City must be 80 characters or fewer'],
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [80, 'State must be 80 characters or fewer'],
      index: true,
    },
    // Optional: plenty of small retailers trade below the registration
    // threshold, and refusing them at the form would turn away real customers.
    gst: {
      type: String,
      trim: true,
      uppercase: true,
      match: [GSTIN_PATTERN, 'Enter a valid 15-character GST number'],
    },
    interests: { type: [String], default: [] },
    status: {
      type: String,
      enum: RETAILER_STATUSES,
      required: true,
      default: 'new',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

// The queue is read as "what is still outstanding, newest first".
retailerApplicationSchema.index({ status: 1, createdAt: -1 });

/** Mongoose model for retailer applications. */
export const RetailerApplication: Model<RetailerApplicationDocument> =
  (mongoose.models.RetailerApplication as Model<RetailerApplicationDocument>) ??
  mongoose.model<RetailerApplicationDocument>(
    'RetailerApplication',
    retailerApplicationSchema,
  );
