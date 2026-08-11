/**
 * `/api/orders/:id` — read, update and delete an order. Admin only.
 *
 * @module pages/api/orders/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireRole, requireSession } from '@/lib/auth';
import { deleteAssets } from '@/lib/cloudinary';
import { deleteOrder, getOrder, updateOrder } from '@/services/order.service';
import { orderSchema } from '@/validation/order.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await getOrder(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(orderSchema, req.body);
    sendSuccess(res, await updateOrder(id, values));
  },

  // Deleting an order destroys the only record of it, so it is owner-only.
  DELETE: async (req, res) => {
    requireRole(req, ['owner']);
    const { publicIds } = await deleteOrder(requireObjectId(req.query.id));
    await deleteAssets(publicIds);
    sendSuccess(res, { deleted: true });
  },
});
