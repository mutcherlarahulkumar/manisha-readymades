/**
 * Internal order model.
 *
 * Orders originate outside the website (WhatsApp, phone, in person) and are
 * recorded by an admin. They are never exposed through a public endpoint.
 *
 * @module models/Order
 */
import mongoose, { Schema, type Model, type Types } from 'mongoose';

import { formatSequence, getNextSequence } from '@/models/Counter';
import { imageAssetSchema } from '@/models/shared';
import { ORDER_STATUSES, type ImageAsset, type OrderStatus } from '@/types/models';

/** Counter name backing the order-number sequence. */
export const ORDER_SEQUENCE = 'order_no';

/** Persisted shape of an order. */
export interface OrderDocument {
  _id: Types.ObjectId;
  orderNo: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  orderDate: Date;
  remarks?: string;
  attachments: ImageAsset[];
  status: OrderStatus;
  assignedTo: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Indian mobile numbers: optional country code, then a 10-digit number starting 6–9. */
const PHONE_PATTERN = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

const orderSchema = new Schema<OrderDocument>(
  {
    orderNo: { type: String, required: true, unique: true, immutable: true },
    customerName: {
      type: String,
      required: [true, 'Customer or shop name is required'],
      trim: true,
      maxlength: [120, 'Name must be 120 characters or fewer'],
      index: true,
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
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [80, 'City must be 80 characters or fewer'],
      index: true,
    },
    orderDate: { type: Date, required: [true, 'Order date is required'], index: true },
    remarks: { type: String, trim: true, maxlength: 1000 },
    attachments: { type: [imageAssetSchema], default: [] },
    status: { type: String, enum: ORDER_STATUSES, required: true, default: 'pending', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
  },
  { timestamps: true },
);

/** Assigns the next sequential order number on insert. */
orderSchema.pre('validate', async function assignOrderNo(next) {
  if (this.isNew && !this.orderNo) {
    this.orderNo = formatSequence('ORD', await getNextSequence(ORDER_SEQUENCE));
  }
  next();
});

// Dashboard listing is almost always "newest first within a status".
orderSchema.index({ status: 1, orderDate: -1 });
// Free-text search across the fields the tracking dashboard searches on.
orderSchema.index({ customerName: 'text', city: 'text', orderNo: 'text', remarks: 'text' });

/** Mongoose model for orders. */
export const Order: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ??
  mongoose.model<OrderDocument>('Order', orderSchema);
