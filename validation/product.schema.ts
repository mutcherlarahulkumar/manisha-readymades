/**
 * Product validation schemas, shared between the admin form and the API.
 *
 * @module validation/product.schema
 */
import * as yup from 'yup';

import {
  imageAssetSchema,
  objectId,
  optionalObjectId,
  optionalText,
  parseCsv,
  requiredText,
} from '@/validation/common';
import { PRODUCT_STATUSES, SIZES } from '@/types/models';

/** Payload accepted when creating a product. The SKU is server-assigned. */
export const productCreateSchema = yup.object({
  name: requiredText('Product name', 140, 3),
  description: optionalText('Description', 2000),
  brand: optionalObjectId('Brand'),
  category: objectId('Category'),
  colors: yup
    .array()
    .of(requiredText('Colour', 40))
    .min(1, 'Add at least one colour')
    .max(20, 'You can add up to 20 colours')
    .required(),
  sizes: yup
    .array()
    .of(yup.string().oneOf(SIZES, 'Unknown size').required())
    .min(1, 'Select at least one size')
    .required(),
  images: yup
    .array()
    .of(imageAssetSchema)
    .min(1, 'Upload at least one image')
    .max(8, 'You can upload up to 8 images')
    .required(),
  price: yup
    .number()
    .typeError('Price must be a number')
    .integer('Price must be a whole number')
    .min(1, 'Price must be at least ₹1')
    .max(1_000_000, 'Price looks too high')
    .required('Price is required'),
  status: yup.string().oneOf(PRODUCT_STATUSES).default('active').required(),
  isFeatured: yup.boolean().default(false).required(),
  isBestSeller: yup.boolean().default(false).required(),
});

/** Payload accepted when updating a product — same rules, SKU still immutable. */
export const productUpdateSchema = productCreateSchema;

/** Values held by the admin product form. */
export type ProductFormValues = yup.InferType<typeof productCreateSchema>;

/** Query parameters accepted by the product list endpoint. */
export const productQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(60).default(24),
  /** Free-text search across name, description and SKU. */
  search: yup.string().trim().max(120).default(''),
  /** Category slugs; a parent slug also matches its children. */
  categories: yup.mixed<string[]>().transform(parseCsv).default([]),
  /** Brand slugs. */
  brands: yup.mixed<string[]>().transform(parseCsv).default([]),
  sizes: yup.mixed<string[]>().transform(parseCsv).default([]),
  colors: yup.mixed<string[]>().transform(parseCsv).default([]),
  minPrice: yup.number().min(0).nullable().default(null),
  maxPrice: yup.number().min(0).nullable().default(null),
  /** Admin-only: omit to see active products only. */
  status: yup.string().oneOf([...PRODUCT_STATUSES, '']).default(''),
  featured: yup.boolean().nullable().default(null),
  sort: yup
    .string()
    .oneOf(['newest', 'price_asc', 'price_desc', 'rating', 'name'])
    .default('newest'),
});

/** Parsed product list query. */
export type ProductQuery = yup.InferType<typeof productQuerySchema>;
