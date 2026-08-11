/**
 * `/api/banners/:id` — read, update and delete a banner.
 *
 * @module pages/api/banners/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { deleteAssets } from '@/lib/cloudinary';
import { deleteBanner, getBanner, updateBanner } from '@/services/marketing.service';
import { bannerSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await getBanner(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(bannerSchema, req.body);
    sendSuccess(res, await updateBanner(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    const { publicIds } = await deleteBanner(requireObjectId(req.query.id));
    await deleteAssets(publicIds);
    sendSuccess(res, { deleted: true });
  },
});
