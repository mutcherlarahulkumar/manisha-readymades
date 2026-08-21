/**
 * `/api/retailers/:id` — review a wholesale account request. Admin only.
 *
 * @module pages/api/retailers/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { reviewRetailerApplication } from '@/services/retailer.service';
import { retailerReviewSchema } from '@/validation/retailer.schema';

export default createHandler({
  PATCH: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id, 'application id');
    const values = await validateBody(retailerReviewSchema, req.body);
    sendSuccess(res, await reviewRetailerApplication(id, values));
  },
});
