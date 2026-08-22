/**
 * `/api/print-samples` — custom printing samples.
 *
 * `GET` is public and returns only visible samples. `POST` requires an admin
 * session.
 *
 * @module pages/api/print-samples/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { validateBody } from '@/lib/api/validate';
import { createPrintSample, listPrintSamples } from '@/services/printSample.service';
import { printSampleSchema } from '@/validation/printSample.schema';

export default createHandler({
  GET: async (req, res) => {
    // An admin needs to see hidden samples in order to unhide them; the
    // storefront must never receive them.
    let isAdmin = true;
    try {
      requireSession(req);
    } catch {
      isAdmin = false;
    }
    sendSuccess(res, await listPrintSamples({ activeOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(printSampleSchema, req.body);
    sendSuccess(res, await createPrintSample(values), 201);
  },
});
