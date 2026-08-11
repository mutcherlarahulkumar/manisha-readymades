/**
 * Admin user model. Only admins authenticate; storefront visitors never log in.
 *
 * @module models/Admin
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { ADMIN_ROLES, type AdminRole } from '@/types/models';

/** Persisted shape of an admin user. */
export interface AdminDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  /** bcrypt hash; excluded from queries by default via `select: false`. */
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminDocument>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, required: true, default: 'staff' },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

/** Mongoose model for admin users. */
export const Admin: Model<AdminDocument> =
  (mongoose.models.Admin as Model<AdminDocument>) ??
  mongoose.model<AdminDocument>('Admin', adminSchema);
