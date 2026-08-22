/**
 * Custom printing sample validation.
 *
 * @module validation/printSample.schema
 */
import * as yup from 'yup';

import { imageAssetSchema, optionalText, requiredText } from '@/validation/common';

/** Payload for creating or updating a printing sample. */
export const printSampleSchema = yup.object({
  title: requiredText('Title', 80, 2),
  description: optionalText('Description', 300),
  image: imageAssetSchema.required('Upload a photo'),
  sortOrder: yup
    .number()
    .typeError('Sort order must be a number')
    .integer('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .default(0)
    .required(),
  isActive: yup.boolean().default(true).required(),
});

/** Values held by the admin sample form. */
export type PrintSampleFormValues = yup.InferType<typeof printSampleSchema>;
