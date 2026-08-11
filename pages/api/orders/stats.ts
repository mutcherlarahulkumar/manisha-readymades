/**
 * `/api/orders/stats` — order counts per lifecycle stage for the tracking
 * dashboard. Admin only.
 *
 * @module pages/api/orders/stats
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { getOrderStatusCounts } from '@/services/order.service';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await getOrderStatusCounts());
  },
});
