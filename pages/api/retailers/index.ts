/**
 * `/api/retailers` — wholesale account requests.
 *
 * `POST` is public: it is the "Become a Retailer" form. `GET` is the admin
 * queue and requires a session.
 *
 * @module pages/api/retailers/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { requireSession } from '@/lib/auth';
import { validateBody, validateQuery } from '@/lib/api/validate';
import {
  createRetailerApplication,
  listRetailerApplications,
} from '@/services/retailer.service';
import { retailerApplicationSchema, retailerQuerySchema } from '@/validation/retailer.schema';

export default createHandler({
  GET: async (req, res) => {
    requireSession(req);
    const query = await validateQuery(retailerQuerySchema, req.query);
    sendSuccess(res, await listRetailerApplications(query));
  },

  POST: async (req, res) => {
    const values = await validateBody(retailerApplicationSchema, req.body);
    await createRetailerApplication(values);
    // The stored record is not echoed back: the applicant has no use for it,
    // and returning it would hand an anonymous caller their own row's id.
    sendSuccess(
      res,
      { message: 'Thank you! We have your details and will be in touch shortly.' },
      201,
    );
  },
});
