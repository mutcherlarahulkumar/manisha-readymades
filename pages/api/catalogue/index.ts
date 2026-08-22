/**
 * `/api/catalogue` — the downloadable wholesale catalogue.
 *
 * `GET` is public: the file is a download anyone may take. `PUT` and `DELETE`
 * replace and remove it, and require an admin session.
 *
 * @module pages/api/catalogue/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { validateBody } from '@/lib/api/validate';
import { deleteCatalogue, getCatalogue, saveCatalogue } from '@/services/catalogue.service';
import { catalogueSchema } from '@/validation/catalogue.schema';

export default createHandler({
  GET: async (_req, res) => {
    sendSuccess(res, await getCatalogue());
  },

  PUT: async (req, res) => {
    requireSession(req);
    const values = await validateBody(catalogueSchema, req.body);
    sendSuccess(res, await saveCatalogue(values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    await deleteCatalogue();
    sendSuccess(res, { message: 'Catalogue removed' });
  },
});
