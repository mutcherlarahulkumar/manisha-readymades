/**
 * Category and brand business logic.
 *
 * Both entities enforce case-insensitive unique names and refuse deletion while
 * they are still referenced, so the catalogue can never contain orphans.
 *
 * @module services/taxonomy.service
 */
import { ApiError } from '@/lib/api/ApiError';
import { serialize } from '@/lib/serialize';
import { Brand, type BrandDocument } from '@/models/Brand';
import { Category, type CategoryDocument } from '@/models/Category';
import { Product } from '@/models/Product';
import type { PaginationMeta } from '@/types/api';
import type { Brand as BrandJson, Category as CategoryJson, CategoryWithParent } from '@/types/models';
import type { BrandFormValues, CategoryFormValues } from '@/validation/taxonomy.schema';

/* ------------------------------------------------------------- categories */

/**
 * Lists categories ordered for display, with parents populated.
 *
 * @param options.activeOnly - Restrict to active categories (storefront).
 * @returns All matching categories.
 */
export async function listCategories(options: { activeOnly?: boolean } = {}): Promise<
  CategoryWithParent[]
> {
  const filter = options.activeOnly ? { isActive: true } : {};
  const docs = await Category.find(filter)
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return serialize<CategoryWithParent[]>(docs);
}

/**
 * Fetches a single category by id.
 *
 * @param id - The category's ObjectId.
 * @returns The category.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getCategory(id: string): Promise<CategoryJson> {
  const doc = await Category.findById(id).lean<CategoryDocument | null>();
  if (!doc) throw ApiError.notFound('Category');
  return serialize<CategoryJson>(doc);
}

/**
 * Creates a category.
 *
 * @param values - Validated form values.
 * @returns The created category.
 * @throws {ApiError} 400 when the parent does not exist, 409 on a duplicate name.
 */
export async function createCategory(values: CategoryFormValues): Promise<CategoryJson> {
  await assertParentIsValid(values.parent, null);
  const created = await Category.create(values);
  return serialize<CategoryJson>(created.toObject());
}

/**
 * Updates a category.
 *
 * @param id - The category's ObjectId.
 * @param values - Validated form values.
 * @returns The updated category.
 * @throws {ApiError} 404 when missing, 400 on an invalid parent, 409 on a duplicate name.
 */
export async function updateCategory(id: string, values: CategoryFormValues): Promise<CategoryJson> {
  await assertParentIsValid(values.parent, id);
  const doc = await Category.findById(id);
  if (!doc) throw ApiError.notFound('Category');

  doc.set(values);
  await doc.save();
  return serialize<CategoryJson>(doc.toObject());
}

/**
 * Deletes a category, refusing while products or child categories reference it.
 *
 * @param id - The category's ObjectId.
 * @throws {ApiError} 404 when missing, 409 when still referenced.
 */
export async function deleteCategory(id: string): Promise<void> {
  const [productCount, childCount] = await Promise.all([
    Product.countDocuments({ category: id }),
    Category.countDocuments({ parent: id }),
  ]);

  if (productCount > 0) {
    throw ApiError.conflict(
      `This category still has ${productCount} product(s). Move or delete them first.`,
    );
  }
  if (childCount > 0) {
    throw ApiError.conflict(
      `This category has ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'}. Delete them first.`,
    );
  }

  const deleted = await Category.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound('Category');
}

/**
 * Validates a proposed parent: it must exist, must not be the category itself,
 * and must not already be a child (the tree is kept at most two levels deep).
 *
 * @param parentId - The proposed parent id, or `null` for a root category.
 * @param selfId - The category being edited, or `null` when creating.
 * @throws {ApiError} 400 when the parent is invalid.
 */
async function assertParentIsValid(parentId: string | null, selfId: string | null): Promise<void> {
  if (!parentId) return;
  if (selfId && parentId === selfId) {
    throw ApiError.badRequest('A category cannot be its own parent');
  }

  const parent = await Category.findById(parentId).select('parent').lean<CategoryDocument | null>();
  if (!parent) throw ApiError.badRequest('Selected parent category no longer exists');
  if (parent.parent) {
    throw ApiError.badRequest('Categories can only be nested one level deep');
  }
}

/* ----------------------------------------------------------------- brands */

/**
 * Lists brands alphabetically.
 *
 * @param options.activeOnly - Restrict to active brands (storefront).
 * @returns All matching brands.
 */
export async function listBrands(options: { activeOnly?: boolean } = {}): Promise<BrandJson[]> {
  const filter = options.activeOnly ? { isActive: true } : {};
  const docs = await Brand.find(filter).sort({ name: 1 }).lean();
  return serialize<BrandJson[]>(docs);
}

/** Largest page size a caller may request, so a hostile query cannot ask for everything. */
const MAX_BRAND_PAGE_SIZE = 48;

/**
 * Lists brands alphabetically, one page at a time.
 *
 * @param options.activeOnly - Restrict to active brands (storefront).
 * @param options.page - 1-based page number; values below 1 are clamped.
 * @param options.limit - Page size, clamped to {@link MAX_BRAND_PAGE_SIZE}.
 * @returns The requested page and its pagination metadata.
 *
 * @remarks
 * Separate from {@link listBrands} rather than replacing it: the admin
 * dashboard and the catalogue's filter sidebar both need every brand at once to
 * populate their controls, and paginating those would be a regression. The
 * count and the page are fetched concurrently, since neither depends on the
 * other.
 */
export async function listBrandsPaginated(
  options: { activeOnly?: boolean; page?: number; limit?: number } = {},
): Promise<{ items: BrandJson[]; meta: PaginationMeta }> {
  const filter = options.activeOnly ? { isActive: true } : {};
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 12), 1), MAX_BRAND_PAGE_SIZE);
  const page = Math.max(Math.trunc(options.page ?? 1), 1);

  const [docs, total] = await Promise.all([
    Brand.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Brand.countDocuments(filter),
  ]);

  return {
    items: serialize<BrandJson[]>(docs),
    meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

/**
 * Fetches a single brand by id.
 *
 * @param id - The brand's ObjectId.
 * @returns The brand.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getBrand(id: string): Promise<BrandJson> {
  const doc = await Brand.findById(id).lean<BrandDocument | null>();
  if (!doc) throw ApiError.notFound('Brand');
  return serialize<BrandJson>(doc);
}

/**
 * Creates a brand.
 *
 * @param values - Validated form values.
 * @returns The created brand.
 * @throws {ApiError} 409 when the name already exists in any casing.
 */
export async function createBrand(values: BrandFormValues): Promise<BrandJson> {
  const created = await Brand.create(values);
  return serialize<BrandJson>(created.toObject());
}

/**
 * Updates a brand.
 *
 * @param id - The brand's ObjectId.
 * @param values - Validated form values.
 * @returns The updated brand.
 * @throws {ApiError} 404 when missing, 409 on a duplicate name.
 */
export async function updateBrand(id: string, values: BrandFormValues): Promise<BrandJson> {
  const doc = await Brand.findById(id);
  if (!doc) throw ApiError.notFound('Brand');

  doc.set(values);
  await doc.save();
  return serialize<BrandJson>(doc.toObject());
}

/**
 * Deletes a brand, refusing while products still reference it.
 *
 * @param id - The brand's ObjectId.
 * @throws {ApiError} 404 when missing, 409 when still referenced.
 */
export async function deleteBrand(id: string): Promise<void> {
  const productCount = await Product.countDocuments({ brand: id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `This brand is used by ${productCount} product(s). Reassign them before deleting.`,
    );
  }

  const deleted = await Brand.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound('Brand');
}
