/**
 * Typed, fail-fast access to environment variables.
 *
 * Server-only variables are read lazily so that importing this module from a
 * file that is also bundled for the client never throws. Anything exposed to
 * the browser must go through {@link publicEnv} and be prefixed `NEXT_PUBLIC_`.
 *
 * @module lib/env
 */

/**
 * Reads a required environment variable, throwing a descriptive error when it
 * is missing. Never include the value in the error message.
 *
 * @param key - Name of the environment variable.
 * @returns The variable's value.
 * @throws {Error} When the variable is unset or empty.
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Server-only secrets. Accessing any of these from client code will throw at build time. */
export const serverEnv = {
  /** MongoDB Atlas connection string. */
  get mongodbUri(): string {
    return required('MONGODB_URI');
  },
  /** Secret used to sign and verify admin session JWTs. */
  get jwtSecret(): string {
    return required('JWT_SECRET');
  },
  /** Cloudinary account credentials. */
  get cloudinary() {
    return {
      cloudName: required('CLOUDINARY_CLOUD_NAME'),
      apiKey: required('CLOUDINARY_API_KEY'),
      apiSecret: required('CLOUDINARY_API_SECRET'),
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'manisha-readymades',
    };
  },
  /** True when running a production build. */
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
} as const;

/** Values that are safe to render in the browser. */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '',
  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? '',
} as const;
