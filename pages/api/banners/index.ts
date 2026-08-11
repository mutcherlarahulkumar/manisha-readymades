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
import { createBanner, listBanners } from '@/services/marketing.service';
import { bannerSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    const isAdmin = getSession(req) !== null;
    sendSuccess(res, await listBanners({ visibleOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(bannerSchema, req.body);
    sendSuccess(res, await createBanner(values), 201);
  },
});
