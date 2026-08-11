/**
 * `/api/auth/me` — returns the current admin session, for client-side guards.
 *
 * @module pages/api/auth/me
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';

export default createHandler({
  GET: async (req, res) => {
    const session = requireSession(req);
    sendSuccess(res, {
      _id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    });
  },
});
