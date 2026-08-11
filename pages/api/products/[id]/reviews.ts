/**
 * `/api/products/:id/reviews` — public review listing and submission.
 *
 * Submissions are held for moderation; only approved reviews are returned.
 *
 * @module pages/api/products/[id]/reviews
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { createReview, listApprovedReviews } from '@/services/marketing.service';
import { reviewCreateSchema } from '@/validation/marketing.schema';

export default createHandler({
  GET: async (req, res) => {
    const id = requireObjectId(req.query.id, 'product id');
    sendSuccess(res, await listApprovedReviews(id));
  },

  POST: async (req, res) => {
    const id = requireObjectId(req.query.id, 'product id');
    const values = await validateBody(reviewCreateSchema, req.body);
    await createReview(id, values);
    sendSuccess(
      res,
      { message: 'Thank you! Your review will appear once it has been approved.' },
      201,
    );
  },
});
