/**
 * `/api/products` — list and create products.
 *
 * - `GET` is public and returns only active products, unless an authenticated
 *   admin is making the request.
 * - `POST` requires an admin session.
 *
 * @module pages/api/products/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { createProduct, listProducts } from '@/services/product.service';
import { productCreateSchema, productQuerySchema } from '@/validation/product.schema';

export default createHandler({
  GET: async (req, res) => {
    const query = await validateQuery(productQuerySchema, req.query);
    const isAdmin = getSession(req) !== null;
    const { items, meta } = await listProducts(query, isAdmin);
    sendSuccess(res, items, 200, meta);
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(productCreateSchema, req.body);
    sendSuccess(res, await createProduct(values), 201);
  },
});
