/**
 * Discount, banner, review and analytics-event validation schemas.
 *
 * @module validation/marketing.schema
 */
import * as yup from 'yup';

import {
  BANNER_POSITIONS,
  DISCOUNT_SCOPES,
  DISCOUNT_TYPES,
  EVENT_TYPES,
  REVIEW_STATUSES,
} from '@/types/models';
import {
  OBJECT_ID_PATTERN,
  imageAssetSchema,
  optionalObjectId,
  optionalText,
  requiredText,
} from '@/validation/common';

/**
 * Discount payload.
 *
 * Cross-field rules: `endsAt` must follow `startsAt`; a percentage discount is
 * capped at 90%; every scope except `all` requires at least one target.
 */
export const discountSchema = yup.object({
  title: requiredText('Title', 80, 3),
  description: optionalText('Description', 300),
  scope: yup.string().oneOf(DISCOUNT_SCOPES).default('all').required('Scope is required'),
  targetIds: yup
    .array()
    .of(yup.string().matches(OBJECT_ID_PATTERN, 'Invalid selection').required())
    .default([])
    .when('scope', {
      is: (scope: string) => scope !== 'all',
      then: (schema) => schema.min(1, 'Select at least one target'),
      otherwise: (schema) => schema.max(0),
    })
    .required(),
  type: yup.string().oneOf(DISCOUNT_TYPES).default('percent').required('Discount type is required'),
  value: yup
    .number()
    .typeError('Value must be a number')
    .min(1, 'Value must be at least 1')
    .required('Value is required')
    .when('type', {
      is: 'percent',
      then: (schema) => schema.max(90, 'Percentage discount cannot exceed 90%'),
      otherwise: (schema) => schema.max(1_000_000, 'Value looks too high'),
    }),
  startsAt: yup.date().typeError('Enter a valid date').required('Start date is required'),
  endsAt: yup
    .date()
    .typeError('Enter a valid date')
    .min(yup.ref('startsAt'), 'End date must be after the start date')
    .required('End date is required'),
  isActive: yup.boolean().default(true).required(),
});

/** Values held by the admin discount form. */
export type DiscountFormValues = yup.InferType<typeof discountSchema>;

/** Banner payload. */
export const bannerSchema = yup.object({
  title: requiredText('Title', 80, 3),
  subtitle: optionalText('Subtitle', 160),
  // Required for the hero, which is a picture; the announcement bar is text and
  // never carries one.
  image: imageAssetSchema
    .nullable()
    .default(null)
    .when('position', {
      is: 'hero',
      then: (schema) => schema.required('The hero needs an image'),
      otherwise: (schema) => schema.strip(),
    }),
  link: yup
    .string()
    .trim()
    .transform((value: string) => (value === '' ? undefined : value))
    .max(500, 'Link is too long')
    .test(
      'is-valid-link',
      'Enter a full URL or a path starting with /',
      (value) => value == null || value.startsWith('/') || /^https?:\/\//.test(value),
    )
    .test(
      'needs-label',
      'Give the button a label',
      (value, ctx) => !value || ctx.parent.position !== 'top' || Boolean(ctx.parent.ctaLabel),
    ),
  // A button label and its destination only make sense together: a label with
  // no link renders a control that goes nowhere, and a link with no label
  // renders nothing at all.
  ctaLabel: yup
    .string()
    .trim()
    .transform((value: string) => (value === '' ? undefined : value))
    .max(24, 'Keep the button label short')
    .test(
      'needs-link',
      'A button needs a destination',
      (value, ctx) => !value || Boolean(ctx.parent.link),
    ),
  position: yup.string().oneOf(BANNER_POSITIONS).default('top').required(),
  startsAt: yup.date().nullable().default(null),
  endsAt: yup
    .date()
    .nullable()
    .default(null)
    .test(
      'after-start',
      'End date must be after the start date',
      (value, ctx) => !value || !ctx.parent.startsAt || value > ctx.parent.startsAt,
    ),
  isActive: yup.boolean().default(true).required(),
});

/** Values held by the admin banner form. */
export type BannerFormValues = yup.InferType<typeof bannerSchema>;

/** Public review submission payload. Images are deliberately not accepted. */
export const reviewCreateSchema = yup.object({
  customerName: requiredText('Your name', 60, 2),
  rating: yup
    .number()
    .typeError('Select a rating')
    .integer('Rating must be a whole number')
    .min(1, 'Select a rating')
    .max(5, 'Rating cannot exceed 5')
    .required('Rating is required'),
  comment: requiredText('Review', 1000, 10),
});

/** Values held by the storefront review form. */
export type ReviewFormValues = yup.InferType<typeof reviewCreateSchema>;

/** Admin moderation payload. */
export const reviewStatusSchema = yup.object({
  status: yup.string().oneOf(REVIEW_STATUSES).required('Status is required'),
});

/** Analytics event payload sent from the storefront. */
export const eventSchema = yup.object({
  type: yup.string().oneOf(EVENT_TYPES).required(),
  product: optionalObjectId('Product'),
});
