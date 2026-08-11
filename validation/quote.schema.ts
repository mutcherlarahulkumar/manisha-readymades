/**
 * Custom-printing quote request validation.
 *
 * Nothing here is persisted — the brief is handed straight to WhatsApp. It is
 * validated strictly all the same, because an incomplete brief costs the owner
 * a round trip of questions before they can quote.
 *
 * @module validation/quote.schema
 */
import * as yup from 'yup';

import { SIZES } from '@/types/models';
import { PHONE_PATTERN, optionalText, requiredText } from '@/validation/common';

/** Printing services a visitor can request a quote for. */
export const QUOTE_SERVICES = [
  'School Uniforms',
  'Company T-Shirts',
  'Event T-Shirts',
  'Political Campaigns',
  'Promotional Clothing',
  'Other',
] as const;

/** @see QUOTE_SERVICES */
export type QuoteService = (typeof QUOTE_SERVICES)[number];

/** Smallest order the owner quotes for. */
const MINIMUM_QUANTITY = 10;

/** The quote brief. */
export const quoteSchema = yup.object({
  service: yup
    .string()
    .oneOf(QUOTE_SERVICES, 'Select a service')
    .required('Please choose a service'),
  customerName: requiredText('Your name', 80, 2),
  organisation: optionalText('Organisation', 100),
  phone: yup
    .string()
    .trim()
    .matches(PHONE_PATTERN, 'Enter a valid 10-digit mobile number')
    .required('Contact number is required'),
  city: requiredText('City', 80, 2),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be a whole number')
    .min(MINIMUM_QUANTITY, `Minimum order is ${MINIMUM_QUANTITY} pieces`)
    .max(100_000, 'Please contact us directly for orders this large')
    .required('Quantity is required'),
  sizes: yup
    .array()
    .of(yup.string().oneOf(SIZES).required())
    .min(1, 'Select at least one size')
    .required('Select at least one size'),
  colorPreference: optionalText('Preferred colours', 120),
  requiredBy: yup
    .date()
    .typeError('Enter a valid date')
    .min(new Date(), 'The date must be in the future')
    .nullable()
    .default(null),
  designNotes: requiredText('Design details', 800, 10),
  notes: optionalText('Additional notes', 500),
});

/** Values held by the quote request form. */
export type QuoteFormValues = yup.InferType<typeof quoteSchema>;
