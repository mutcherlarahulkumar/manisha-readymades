/**
 * `/api/categories` — list and create categories.
 *
 * @module pages/api/categories/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { createCategory, listCategories } from '@/services/taxonomy.service';
import { categorySchema } from '@/validation/taxonomy.schema';

export default createHandler({
  GET: async (req, res) => {
    const isAdmin = getSession(req) !== null;
    sendSuccess(res, await listCategories({ activeOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(categorySchema, req.body);
    sendSuccess(res, await createCategory(values), 201);
  },
});
