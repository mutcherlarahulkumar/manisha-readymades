/**
 * `/api/orders` — list and create internal orders. Admin only, never public.
 *
 * @module pages/api/orders/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { createOrder, listOrders } from '@/services/order.service';
import { orderQuerySchema, orderSchema } from '@/validation/order.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    const query = await validateQuery(orderQuerySchema, req.query);
    const { items, meta } = await listOrders(query);
    sendSuccess(res, items, 200, meta);
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(orderSchema, req.body);
    sendSuccess(res, await createOrder(values), 201);
  },
});
