/**
 * Product enquiry validation.
 *
 * Like the quote brief, nothing is persisted — the selection is handed to
 * WhatsApp. It is validated against the product's own sizes and colours so a
 * visitor cannot enquire about a variant that is not stocked.
 *
 * @module validation/enquiry.schema
 */
import * as yup from 'yup';

import { optionalText } from '@/validation/common';

/**
 * Builds an enquiry schema constrained to one product's variants.
 *
 * The allowed values differ per product, so the schema is created per product
 * rather than declared once.
 *
 * @param sizes - Sizes this product is stocked in.
 * @param colors - Colours this product is stocked in.
 * @returns A Yup schema for the enquiry form.
 *
 * @example
 * ```ts
 * const schema = buildEnquirySchema(product.sizes, product.colors);
 * ```
 */
export function buildEnquirySchema(sizes: readonly string[], colors: readonly string[]) {
  return yup.object({
    size: yup
      .string()
      .oneOf([...sizes], 'Select an available size')
      .required('Please select a size'),
    color: yup
      .string()
      .oneOf([...colors], 'Select an available colour')
      .required('Please select a colour'),
    quantity: yup
      .number()
      .typeError('Quantity must be a number')
      .integer('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(100_000, 'Please contact us directly for orders this large')
      .required('Quantity is required'),
    notes: optionalText('Notes', 400),
  });
}

/** Values held by the product enquiry form. */
export interface EnquiryFormValues {
  size: string;
  color: string;
  quantity: number;
  notes?: string;
}
