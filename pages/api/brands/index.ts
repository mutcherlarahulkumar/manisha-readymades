/**
 * `/api/brands` — list and create brands.
 *
 * @module pages/api/brands/index
 */
import { createHandler, sendSuccess } from '@/lib/api/handler';
import { validateBody } from '@/lib/api/validate';
import { getSession, requireSession } from '@/lib/auth';
import { createBrand, listBrands, listBrandsPaginated } from '@/services/taxonomy.service';
import { brandSchema } from '@/validation/taxonomy.schema';

/**
 * Reads a positive integer query parameter.
 *
 * @param value - The raw query value.
 * @returns The parsed number, or `undefined` when absent or unparseable.
 */
function toPositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default createHandler({
  GET: async (req, res) => {
    const isAdmin = getSession(req) !== null;
    const page = toPositiveInt(req.query.page);

    // Paginated only when the caller asks for a page. The admin dashboard and
    // the catalogue's brand filter both read this endpoint expecting the full
    // array, so the unpaginated shape has to stay the default rather than
    // becoming a breaking change to two working screens.
    if (page !== undefined) {
      const result = await listBrandsPaginated({
        activeOnly: !isAdmin,
        page,
        limit: toPositiveInt(req.query.limit) ?? 12,
      });
      sendSuccess(res, result.items, 200, result.meta);
      return;
    }

    sendSuccess(res, await listBrands({ activeOnly: !isAdmin }));
  },

  POST: async (req, res) => {
    requireSession(req);
    const values = await validateBody(brandSchema, req.body);
    sendSuccess(res, await createBrand(values), 201);
  },
});
