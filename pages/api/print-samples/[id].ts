/**
 * `/api/print-samples/:id` — update or remove a sample. Admin only.
 *
 * @module pages/api/print-samples/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { deletePrintSample, updatePrintSample } from '@/services/printSample.service';
import { printSampleSchema } from '@/validation/printSample.schema';

export default createHandler({
  PUT: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id, 'sample id');
    const values = await validateBody(printSampleSchema, req.body);
    sendSuccess(res, await updatePrintSample(id, values));
  },

  DELETE: async (req, res) => {
    requireSession(req);
    const id = requireObjectId(req.query.id, 'sample id');
    await deletePrintSample(id);
    sendSuccess(res, { message: 'Sample removed' });
  },
});
