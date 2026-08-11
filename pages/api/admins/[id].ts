/**
 * `/api/admins/:id` — read, update and delete an admin user. Owner only.
 *
 * @module pages/api/admins/[id]
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireObjectId, validateBody } from '@/lib/api/validate';
import { requireRole } from '@/lib/auth';
import { deleteAdmin, getAdmin, updateAdmin } from '@/services/admin.service';
import { adminUpdateSchema } from '@/validation/admin.schema';

export default createHandler({
  GET: async (req, res) => {
    requireRole(req, ['owner']);
    sendSuccess(res, await getAdmin(requireObjectId(req.query.id)));
  },

  PUT: async (req, res) => {
    const actor = requireRole(req, ['owner']);
    const id = requireObjectId(req.query.id);
    const values = await validateBody(adminUpdateSchema, req.body);
    sendSuccess(res, await updateAdmin(id, values, actor));
  },

  DELETE: async (req, res) => {
    const actor = requireRole(req, ['owner']);
    await deleteAdmin(requireObjectId(req.query.id), actor);
    sendSuccess(res, { deleted: true });
  },
});
