/**
 * `/api/brands/:id` — read, update and delete a brand.
 *
 * @module pages/api/brands/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { deleteBrand, getBrand, updateBrand } from '@/services/taxonomy.service';
import { brandSchema } from '@/validation/taxonomy.schema';

export default createHandler({
  GET: async (req, res) => {
    sendSuccess(res, await getBrand(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(brandSchema, req.body);
    sendSuccess(res, await updateBrand(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    await deleteBrand(requireObjectId(req.query.id));
    sendSuccess(res, { deleted: true });
  },
});
