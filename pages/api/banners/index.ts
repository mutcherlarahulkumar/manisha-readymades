/**
 * `/api/banners` — list and create banners.
 *
 * Visitors see only banners that are active and within their schedule; admins
 * see every banner so they can manage upcoming and expired ones.
 *
 * @module pages/api/banners/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { listBanners, saveBanner } from '@/services/marketing.service';
import { bannerSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    const isAdmin = getSession(req) !== null;
    sendSuccess(res, await listBanners({ visibleOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(bannerSchema, req.body);
    // Upsert: each position is a single slot, so posting the same position
    // again replaces it rather than creating a rival banner.
    sendSuccess(res, await saveBanner(values), 200);
  },
});
