/**
 * `/api/discounts/:id` — read, update and delete a discount rule. Admin only.
 *
 * @module pages/api/discounts/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { deleteDiscount, getDiscount, updateDiscount } from '@/services/marketing.service';
import { discountSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await getDiscount(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(discountSchema, req.body);
    sendSuccess(res, await updateDiscount(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    await deleteDiscount(requireObjectId(req.query.id));
    sendSuccess(res, { deleted: true });
  },
});
