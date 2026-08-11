/**
 * `/api/events` — records a storefront interaction for analytics.
 *
 * Public and unauthenticated by necessity. The payload carries no personal
 * data, and a failure here is reported as success so a tracking problem can
 * never disrupt browsing.
 *
 * @module pages/api/events/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { recordEvent } from '@/services/analytics.service';
import { eventSchema } from '@/validation/marketing.schema';

export default createHandler({
  POST: async (req, res) => {
    const { type, product } = await validateBody(eventSchema, req.body);

    try {
      await recordEvent(type, product);
    } catch (error) {
      console.error('[events] Failed to record event:', error);
    }

    // 202: accepted for processing, with no guarantee it was persisted.
    sendSuccess(res, { recorded: true }, 202);
  },
});
