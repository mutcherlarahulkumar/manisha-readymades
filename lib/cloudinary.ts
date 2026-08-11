/**
 * Cloudinary integration.
 *
 * The browser never sees the API secret. Instead the server issues a short-lived
 * signature that the client uses to upload directly to Cloudinary, so large
 * files never pass through the serverless function (which has a small body
 * limit and a short timeout).
 *
 * @module lib/cloudinary
 */
import { v2 as cloudinary } from 'cloudinary';

import { serverEnv } from '@/lib/env';

/** Everything the browser needs to perform a signed direct upload. */
export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/** Configures the SDK once per warm serverless instance. */
function configure(): void {
  const { cloudName, apiKey, apiSecret } = serverEnv.cloudinary;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Creates a signature authorising a single direct upload from the browser.
 *
 * @param folder - Sub-folder within the configured root, e.g. `products`.
 * @returns The signature and the public parameters that must accompany it.
 *
 * @example
 * ```ts
 * const signature = createUploadSignature('products');
 * // client posts file + signature + timestamp + api_key + folder to uploadUrl
 * ```
 */
export function createUploadSignature(folder: string): UploadSignature {
  configure();
  const { cloudName, apiKey, apiSecret, folder: root } = serverEnv.cloudinary;

  const timestamp = Math.round(Date.now() / 1000);
  const scopedFolder = `${root}/${folder}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: scopedFolder },
    apiSecret,
  );

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: scopedFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

/**
 * Deletes assets from Cloudinary.
 *
 * Failures are logged and swallowed: an orphaned asset costs a little storage,
 * whereas a failed delete must not roll back a successful database deletion.
 *
 * @param publicIds - Cloudinary public ids to remove.
 */
export async function deleteAssets(publicIds: readonly string[]): Promise<void> {
  if (publicIds.length === 0) return;

  try {
    configure();
    await cloudinary.api.delete_resources([...publicIds], { invalidate: true });
  } catch (error) {
    console.error('[cloudinary] Failed to delete assets:', error);
  }
}
