/**
 * Retailer application validation.
 *
 * @module validation/retailer.schema
 */
import * as yup from 'yup';

import { RETAILER_STATUSES } from '@/types/models';
import { PHONE_PATTERN, optionalText, paginationQuerySchema, requiredText } from '@/validation/common';

/**
 * Structural GSTIN check: state code, PAN, entity number, 'Z', checksum.
 *
 * @remarks
 * Confirms the shape only. Whether the number is actually registered is for
 * whoever reviews the application to check on the GST portal — the form should
 * not reject a real retailer over an unverifiable field.
 */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

/** What the public "Become a Retailer" form submits. */
export const retailerApplicationSchema = yup.object({
  shopName: requiredText('Shop name', 120, 2),
  ownerName: requiredText('Owner name', 120, 2),
  phone: yup
    .string()
    .trim()
    .matches(PHONE_PATTERN, 'Enter a valid 10-digit mobile number')
    .required('Phone number is required'),
  // Usually the same as the phone number, so the form offers to copy it rather
  // than making the applicant type it twice.
  whatsapp: yup
    .string()
    .trim()
    .matches(PHONE_PATTERN, { message: 'Enter a valid 10-digit WhatsApp number', excludeEmptyString: true })
    .optional(),
  city: requiredText('City', 80, 2),
  state: requiredText('State', 80, 2),
  gst: yup
    .string()
    .trim()
    .uppercase()
    .matches(GSTIN_PATTERN, {
      message: 'Enter a valid 15-character GST number, or leave this blank',
      excludeEmptyString: true,
    })
    .optional(),
  interests: yup
    .array()
    .of(yup.string().trim().max(60).required())
    .min(1, 'Tell us at least one thing you want to stock')
    .default([])
    .required(),
});

/** Values held by the public retailer form. */
export type RetailerApplicationValues = yup.InferType<typeof retailerApplicationSchema>;

/** What an admin may change on an existing application. */
export const retailerReviewSchema = yup.object({
  status: yup.string().oneOf(RETAILER_STATUSES).required(),
  notes: optionalText('Notes', 1000),
});

/** Values held by the admin review form. */
export type RetailerReviewValues = yup.InferType<typeof retailerReviewSchema>;

/** Query parameters for the admin application list. */
export const retailerQuerySchema = paginationQuerySchema.shape({
  status: yup.string().oneOf([...RETAILER_STATUSES, '']).default(''),
});

/** @see retailerQuerySchema */
export type RetailerQuery = yup.InferType<typeof retailerQuerySchema>;
