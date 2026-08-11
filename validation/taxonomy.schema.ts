/**
 * Category and brand validation schemas.
 *
 * @module validation/taxonomy.schema
 */
import * as yup from 'yup';

import { imageAssetSchema, optionalObjectId, optionalText, requiredText } from '@/validation/common';

/** Payload for creating or updating a category. */
export const categorySchema = yup.object({
  name: requiredText('Category name', 60, 2),
  /** `null` for a top-level category. */
  parent: optionalObjectId('Parent category'),
  description: optionalText('Description', 500),
  image: imageAssetSchema.nullable().default(null),
  sortOrder: yup
    .number()
    .typeError('Sort order must be a number')
    .integer('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .default(0)
    .required(),
  isActive: yup.boolean().default(true).required(),
});

/** Values held by the admin category form. */
export type CategoryFormValues = yup.InferType<typeof categorySchema>;

/** Payload for creating or updating a brand. */
export const brandSchema = yup.object({
  name: requiredText('Brand name', 60, 2),
  logo: imageAssetSchema.nullable().default(null),
  isActive: yup.boolean().default(true).required(),
});

/** Values held by the admin brand form. */
export type BrandFormValues = yup.InferType<typeof brandSchema>;
