/**
 * `/api/reviews` — moderation queue listing. Admin only.
 *
 * Public submission lives at `/api/products/:id/reviews`.
 *
 * @module pages/api/reviews/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { listReviews } from '@/services/marketing.service';
import { REVIEW_STATUSES, type ReviewStatus } from '@/types/models';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    const raw = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    const status = REVIEW_STATUSES.includes(raw as ReviewStatus) ? (raw as ReviewStatus) : undefined;
    sendSuccess(res, await listReviews(status ? { status } : {}));
  },
});
