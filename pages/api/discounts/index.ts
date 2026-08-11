/**
 * `/api/discounts` — list and create discount rules. Admin only.
 *
 * @module pages/api/discounts/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { createDiscount, listDiscounts } from '@/services/marketing.service';
import { discountSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await listDiscounts());
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(discountSchema, req.body);
    sendSuccess(res, await createDiscount(values), 201);
  },
});
