/**
 * Yup building blocks shared by every schema.
 *
 * Schemas in this directory are the single source of truth for validation:
 * Formik uses them on the client and the API routes re-run them on the server,
 * so a bypassed form cannot write invalid data.
 *
 * @module validation/common
 */
import * as yup from 'yup';

/** Matches a 24-character hexadecimal MongoDB ObjectId. */
export const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** Indian mobile number, with an optional +91 prefix. */
export const PHONE_PATTERN = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

/**
 * A required MongoDB ObjectId field.
 *
 * @param label - Human-readable field name used in error messages.
 * @returns A Yup string schema validating an ObjectId.
 */
export const objectId = (label: string): yup.StringSchema<string> =>
  yup
    .string()
    .trim()
    .matches(OBJECT_ID_PATTERN, `${label} is not valid`)
    .required(`${label} is required`);

/**
 * An optional ObjectId field.
 *
 * An empty string, `null` or an absent key all normalise to `null`, so a form
 * that simply omits the field is as valid as one that clears it.
 *
 * @param label - Human-readable field name used in error messages.
 * @returns A Yup schema producing `string | null`.
 */
export const optionalObjectId = (label: string) =>
  yup
    .string()
    .trim()
    .transform((value: string) => (value === '' ? null : value))
    .nullable()
    .default(null)
    .test(
      'is-object-id',
      `${label} is not valid`,
      (value) => value == null || OBJECT_ID_PATTERN.test(value),
    );

/**
 * A trimmed, required text field with a maximum length.
 *
 * @param label - Human-readable field name used in error messages.
 * @param max - Maximum permitted length.
 * @param min - Minimum permitted length, defaults to 1.
 * @returns A Yup string schema.
 */
export const requiredText = (label: string, max: number, min = 1): yup.StringSchema<string> =>
  yup
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .required(`${label} is required`);

/**
 * A trimmed, optional text field that normalises empty input to `undefined`.
 *
 * @param label - Human-readable field name used in error messages.
 * @param max - Maximum permitted length.
 * @returns A Yup string schema.
 */
export const optionalText = (label: string, max: number): yup.StringSchema<string | undefined> =>
  yup
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value: string) => (value === '' ? undefined : value));

/** Schema for a Cloudinary image reference embedded in a form value. */
export const imageAssetSchema = yup.object({
  url: yup.string().trim().url('Image URL is not valid').required(),
  publicId: yup.string().trim().required(),
  alt: optionalText('Alt text', 160),
});

/** Reusable pagination and sorting query parameters. */
export const paginationQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});

/**
 * Coerces a comma-separated query string into a string array.
 *
 * @param value - Raw query value.
 * @returns The parsed, non-empty segments.
 *
 * @example
 * ```ts
 * parseCsv('S,M,L'); // ['S', 'M', 'L']
 * ```
 */
export function parseCsv(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string' || value.trim() === '') return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
