/**
 * `/api/orders/:id/status` — move an order to the next lifecycle stage.
 *
 * Separate from the full update endpoint so the tracking dashboard can advance
 * an order without resubmitting the whole record.
 *
 * @module pages/api/orders/[id]/status
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { updateOrderStatus } from '@/services/order.service';
import { orderStatusSchema } from '@/validation/order.schema';

export default createHandler({
  PATCH: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const { status } = await validateBody(orderStatusSchema, req.body);
    sendSuccess(res, await updateOrderStatus(id, status));
  },
});
