/**
 * `/api/admins` — list and create admin users. Owner only.
 *
 * @module pages/api/admins/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { requireRole, requireSession } from '@/lib/auth';
import { createAdmin, listAdmins } from '@/services/admin.service';
import { adminCreateSchema } from '@/validation/admin.schema';

export default createHandler({
  // Any admin may read the list, so orders can be assigned to a colleague.
  GET: async (req, res) => {
    requireSession(req);
    sendSuccess(res, await listAdmins());
  },

  POST: async (req, res) => {
    requireRole(req, ['owner']);
    const values = await validateBody(adminCreateSchema, req.body);
    sendSuccess(res, await createAdmin(values), 201);
  },
});
