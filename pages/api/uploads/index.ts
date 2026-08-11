/**
 * `/api/uploads` — issues a short-lived Cloudinary upload signature.
 *
 * The file itself goes straight from the browser to Cloudinary, so it never
 * passes through the serverless function's 4 MB body limit. Only an
 * authenticated admin can obtain a signature.
 *
 * @module pages/api/uploads/index
 */
import { ApiError } from '@/lib/api/ApiError';
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { createUploadSignature } from '@/lib/cloudinary';

/** Folders an admin is permitted to upload into. */
const ALLOWED_FOLDERS = ['products', 'banners', 'orders', 'categories', 'brands'] as const;

/** @see ALLOWED_FOLDERS */
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export default createHandler({
  POST: async (req, res) => {
    requireSession(req);

    const folder = (req.body as { folder?: string })?.folder;
    if (!folder || !ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
      throw ApiError.badRequest(
        `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`,
      );
    }

    sendSuccess(res, createUploadSignature(folder));
  },
});
