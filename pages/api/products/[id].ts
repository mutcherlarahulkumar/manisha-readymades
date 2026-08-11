/**
 * `/api/products/:id` — read, update and delete a single product.
 *
 * @module pages/api/products/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { deleteAssets } from '@/lib/cloudinary';
import { deleteProduct, getProduct, updateProduct } from '@/services/product.service';
import { productUpdateSchema } from '@/validation/product.schema';

export default createHandler({
  GET: async (req, res) => {
    const id = requireObjectId(req.query.id);
    const isAdmin = getSession(req) !== null;
    sendSuccess(res, await getProduct({ id }, isAdmin));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(productUpdateSchema, req.body);
    sendSuccess(res, await updateProduct(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const { publicIds } = await deleteProduct(id);
    await deleteAssets(publicIds);
    sendSuccess(res, { deleted: true });
  },
});
