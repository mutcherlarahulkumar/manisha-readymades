/**
 * Admin authentication and user-management validation schemas.
 *
 * @module validation/admin.schema
 */
import * as yup from 'yup';

import { ADMIN_ROLES } from '@/types/models';
import { requiredText } from '@/validation/common';

/** Minimum acceptable password length. */
const PASSWORD_MIN = 8;

/** Requires a mix of letters and digits at the minimum length. */
const passwordSchema = yup
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(72, 'Password must be 72 characters or fewer')
  .matches(/[A-Za-z]/, 'Password must contain a letter')
  .matches(/\d/, 'Password must contain a number')
  .required('Password is required');

/** Login form and endpoint payload. */
export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup.string().required('Password is required'),
});

/** Values held by the login form. */
export type LoginFormValues = yup.InferType<typeof loginSchema>;

/** Payload for creating an admin user. */
export const adminCreateSchema = yup.object({
  name: requiredText('Name', 80, 2),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: passwordSchema,
  role: yup.string().oneOf(ADMIN_ROLES).default('staff').required('Role is required'),
  isActive: yup.boolean().default(true).required(),
});

/** Payload for updating an admin user. The password is optional on update. */
export const adminUpdateSchema = adminCreateSchema.shape({
  password: passwordSchema.optional().transform((value: string) => (value === '' ? undefined : value)),
});

/** Values held by the admin-user form. */
export type AdminFormValues = yup.InferType<typeof adminCreateSchema>;
