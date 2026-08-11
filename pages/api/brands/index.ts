/**
 * `/api/brands` — list and create brands.
 *
 * @module pages/api/brands/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { createBrand, listBrands } from '@/services/taxonomy.service';
import { brandSchema } from '@/validation/taxonomy.schema';

export default createHandler({
  GET: async (req, res) => {
    const isAdmin = getSession(req) !== null;
    sendSuccess(res, await listBrands({ activeOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(brandSchema, req.body);
    sendSuccess(res, await createBrand(values), 201);
  },
});
