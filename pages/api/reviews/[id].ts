/**
 * `/api/reviews/:id` — moderate or delete a review. Admin only.
 *
 * @module pages/api/reviews/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireSession } from '@/lib/auth';
import { deleteReview, updateReviewStatus } from '@/services/marketing.service';
import { reviewStatusSchema } from '@/validation/marketing.schema';

export default createHandler({
  PATCH: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id);
    const { status } = await validateBody(reviewStatusSchema, req.body);
    sendSuccess(res, await updateReviewStatus(id, status));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    await deleteReview(requireObjectId(req.query.id));
    sendSuccess(res, { deleted: true });
  },
});
