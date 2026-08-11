/**
 * `/api/analytics/summary` — catalogue and engagement metrics. Admin only.
 *
 * @module pages/api/analytics/summary
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { getAnalyticsSummary } from '@/services/analytics.service';

/** Windows the dashboard is allowed to request, in days. */
const ALLOWED_WINDOWS = [7, 30, 90] as const;

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);

    const raw = Number(Array.isArray(req.query.days) ? req.query.days[0] : req.query.days);
    const days = ALLOWED_WINDOWS.includes(raw as (typeof ALLOWED_WINDOWS)[number]) ? raw : 30;

    sendSuccess(res, await getAnalyticsSummary(days));
  },
});
