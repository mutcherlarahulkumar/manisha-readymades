/**
 * Order validation schemas for the internal order-management portal.
 *
 * @module validation/order.schema
 */
import * as yup from 'yup';

import { ORDER_STATUSES } from '@/types/models';
import {
  PHONE_PATTERN,
  imageAssetSchema,
  optionalObjectId,
  optionalText,
  parseCsv,
  requiredText,
} from '@/validation/common';

/** Payload for creating or updating an order. */
export const orderSchema = yup.object({
  customerName: requiredText('Customer or shop name', 120, 2),
  phone: yup
    .string()
    .trim()
    .matches(PHONE_PATTERN, 'Enter a valid 10-digit mobile number')
    .required('Contact number is required'),
  whatsapp: yup
    .string()
    .trim()
    .transform((value: string) => (value === '' ? undefined : value))
    .matches(PHONE_PATTERN, { message: 'Enter a valid 10-digit WhatsApp number', excludeEmptyString: true }),
  city: requiredText('City', 80, 2),
  orderDate: yup
    .date()
    .typeError('Enter a valid date')
    .max(new Date(Date.now() + 86_400_000), 'Order date cannot be in the future')
    .required('Order date is required'),
  remarks: optionalText('Remarks', 1000),
  attachments: yup
    .array()
    .of(imageAssetSchema)
    .max(10, 'You can attach up to 10 files')
    .default([])
    .required(),
  status: yup.string().oneOf(ORDER_STATUSES).default('pending').required(),
  assignedTo: optionalObjectId('Assigned staff member'),
});

/** Values held by the admin order form. */
export type OrderFormValues = yup.InferType<typeof orderSchema>;

/** Payload for the status-only transition endpoint. */
export const orderStatusSchema = yup.object({
  status: yup.string().oneOf(ORDER_STATUSES).required('Status is required'),
});

/** Query parameters accepted by the order list endpoint. */
export const orderQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
  /** Matches customer name, order number, city or remarks. */
  search: yup.string().trim().max(120).default(''),
  /** Exact match on either the contact or WhatsApp number. */
  phone: yup.string().trim().max(20).default(''),
  city: yup.string().trim().max(80).default(''),
  statuses: yup.mixed<string[]>().transform(parseCsv).default([]),
  assignedTo: yup.string().trim().default(''),
  dateFrom: yup.date().nullable().default(null),
  dateTo: yup.date().nullable().default(null),
  sort: yup.string().oneOf(['newest', 'oldest']).default('newest'),
});

/** Parsed order list query. */
export type OrderQuery = yup.InferType<typeof orderQuerySchema>;
