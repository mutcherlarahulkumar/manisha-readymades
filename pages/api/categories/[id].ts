/**
 * `/api/categories/:id` — read, update and delete a category.
 *
 * @module pages/api/categories/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { deleteCategory, getCategory, updateCategory } from '@/services/taxonomy.service';
import { categorySchema } from '@/validation/taxonomy.schema';

export default createHandler({
  GET: async (req, res) => {
    sendSuccess(res, await getCategory(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(categorySchema, req.body);
    sendSuccess(res, await updateCategory(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    await deleteCategory(requireObjectId(req.query.id));
    sendSuccess(res, { deleted: true });
  },
});
