/**
 * `/api/auth/login` — exchanges admin credentials for a bearer token.
 *
 * The client stores the returned token and sends it as
 * `Authorization: Bearer <token>` on every admin request.
 *
 * @module pages/api/auth/login
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { TOKEN_MAX_AGE, signSession } from '@/lib/auth';
import { authenticate } from '@/services/admin.service';
import { loginSchema } from '@/validation/admin.schema';

export default createHandler({
  POST: async (req, res) => {
    const { email, password } = await validateBody(loginSchema, req.body);
    const session = await authenticate(email, password);

    sendSuccess(res, {
      token: signSession(session),
      expiresIn: TOKEN_MAX_AGE,
      admin: {
        _id: session.sub,
        name: session.name,
        email: session.email,
        role: session.role,
      },
    });
  },
});
