/**
 * Product business logic: filtering, pricing resolution and CRUD.
 *
 * API route handlers stay thin by delegating here; nothing in this module
 * touches `req`/`res`.
 *
 * @module services/product.service
 */
import { Types, type FilterQuery, type SortOrder } from 'mongoose';

import { ApiError } from '@/lib/api/ApiError';
import { serialize } from '@/lib/serialize';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
import { Product, type ProductDocument } from '@/models/Product';
import { Review } from '@/models/Review';
import { applyDiscounts, getActiveDiscounts } from '@/services/pricing.service';
import type { Paginated } from '@/types/api';
import type { Product as ProductJson, ProductListItem } from '@/types/models';
import type { ProductFormValues, ProductQuery } from '@/validation/product.schema';

/** Sort specifications keyed by the public `sort` query value. */
const SORT_MAP: Record<ProductQuery['sort'], Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
  name: { name: 1 },
};

/** A lean product with its brand and category populated. */
type PopulatedProduct = Omit<ProductDocument, 'brand' | 'category'> & {
  brand: { _id: unknown; name: string; slug: string } | null;
  category: { _id: unknown; name: string; slug: string };
};

/**
 * Resolves category slugs to ids, expanding each match to include its direct
 * children so that filtering by "Men's Wear" also returns "T-Shirts".
 *
 * @param slugs - Category slugs from the query string.
 * @returns Matching category ids, empty when no slugs were supplied.
 */
async function resolveCategoryIds(slugs: readonly string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const matched = await Category.find({ slug: { $in: slugs } })
    .select('_id')
    .lean();
  const ids = matched.map((doc) => doc._id.toString());
  if (ids.length === 0) return ['000000000000000000000000']; // no match → return nothing

  const children = await Category.find({ parent: { $in: ids } })
    .select('_id')
    .lean();
  return [...ids, ...children.map((doc) => doc._id.toString())];
}

/**
 * Builds the Mongo filter for a product query.
 *
 * @param query - The validated query parameters.
 * @param includeInactive - When false, only `active` products are matched.
 * @returns A Mongoose filter document.
 */
async function buildFilter(
  query: ProductQuery,
  includeInactive: boolean,
): Promise<FilterQuery<ProductDocument>> {
  const filter: FilterQuery<ProductDocument> = {};

  if (!includeInactive) {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    // Escaped regex rather than $text so partial SKU matches work too.
    const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    filter.$or = [{ name: pattern }, { sku: pattern }, { description: pattern }];
  }

  const categoryIds = await resolveCategoryIds(query.categories);
  if (categoryIds.length > 0) filter.category = { $in: categoryIds };

  if (query.brands.length > 0) {
    const brands = await Brand.find({ slug: { $in: query.brands } })
      .select('_id')
      .lean();
    filter.brand = { $in: brands.map((doc) => doc._id) };
  }

  if (query.sizes.length > 0) filter.sizes = { $in: query.sizes };
  if (query.colors.length > 0) {
    filter.colors = { $in: query.colors.map((color) => new RegExp(`^${color}$`, 'i')) };
  }
  if (query.featured !== null) filter.isFeatured = query.featured;

  if (query.minPrice !== null || query.maxPrice !== null) {
    filter.price = {};
    if (query.minPrice !== null) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== null) filter.price.$lte = query.maxPrice;
  }

  return filter;
}

/**
 * Attaches resolved pricing to a populated product document.
 *
 * @param doc - A lean, populated product.
 * @param discounts - Active discounts for this request.
 * @returns The serialised list item.
 */
function toListItem(
  doc: PopulatedProduct,
  discounts: Awaited<ReturnType<typeof getActiveDiscounts>>,
): ProductListItem {
  const json = serialize<Omit<ProductListItem, 'pricing'>>(doc);
  return {
    ...json,
    pricing: applyDiscounts(
      {
        productId: json._id,
        categoryId: json.category._id,
        brandId: json.brand?._id ?? null,
        price: doc.price,
      },
      discounts,
    ),
  };
}

/**
 * Lists products with filtering, sorting, pagination and resolved pricing.
 *
 * @param query - Validated query parameters.
 * @param includeInactive - Pass true only for authenticated admin listings.
 * @returns A page of product list items.
 */
export async function listProducts(
  query: ProductQuery,
  includeInactive = false,
): Promise<Paginated<ProductListItem>> {
  const filter = await buildFilter(query, includeInactive);
  const skip = (query.page - 1) * query.limit;

  const [docs, total, discounts] = await Promise.all([
    Product.find(filter)
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .sort(SORT_MAP[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean<PopulatedProduct[]>(),
    Product.countDocuments(filter),
    getActiveDiscounts(),
  ]);

  return {
    items: docs.map((doc) => toListItem(doc, discounts)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

/**
 * Fetches a single product by id or slug, with pricing resolved.
 *
 * @param idOrSlug - A MongoDB ObjectId or the product's slug.
 * @param includeInactive - Pass true for admin reads.
 * @returns The product list item.
 * @throws {ApiError} 404 when no visible product matches.
 */
export async function getProduct(
  idOrSlug: { id?: string; slug?: string },
  includeInactive = false,
): Promise<ProductListItem> {
  const filter: FilterQuery<ProductDocument> = idOrSlug.id
    ? { _id: idOrSlug.id }
    : { slug: idOrSlug.slug };
  if (!includeInactive) filter.status = 'active';

  const [doc, discounts] = await Promise.all([
    Product.findOne(filter)
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .lean<PopulatedProduct | null>(),
    getActiveDiscounts(),
  ]);

  if (!doc) throw ApiError.notFound('Product');
  return toListItem(doc, discounts);
}

/**
 * Creates a product. The SKU is assigned automatically by the model.
 *
 * @param values - Validated form values.
 * @returns The created product.
 * @throws {ApiError} 400 when the referenced category or brand does not exist.
 */
export async function createProduct(values: ProductFormValues): Promise<ProductJson> {
  await assertReferencesExist(values);
  const created = await Product.create(values);
  return serialize<ProductJson>(created.toObject());
}

/**
 * Updates a product in place, preserving its SKU.
 *
 * @param id - The product's ObjectId.
 * @param values - Validated form values.
 * @returns The updated product.
 * @throws {ApiError} 404 when the product does not exist.
 */
export async function updateProduct(id: string, values: ProductFormValues): Promise<ProductJson> {
  await assertReferencesExist(values);
  const doc = await Product.findById(id);
  if (!doc) throw ApiError.notFound('Product');

  doc.set(values);
  await doc.save(); // save() so the slug hook and schema validators both run
  return serialize<ProductJson>(doc.toObject());
}

/**
 * Deletes a product together with its reviews.
 *
 * Cloudinary assets are removed by the caller, which has the public ids.
 *
 * @param id - The product's ObjectId.
 * @returns The public ids of the images that were attached.
 * @throws {ApiError} 404 when the product does not exist.
 */
export async function deleteProduct(id: string): Promise<{ publicIds: string[] }> {
  const doc = await Product.findByIdAndDelete(id).lean<ProductDocument | null>();
  if (!doc) throw ApiError.notFound('Product');

  await Review.deleteMany({ product: id });
  return { publicIds: doc.images.map((image) => image.publicId) };
}

/**
 * Verifies that the category and optional brand referenced by a payload exist.
 *
 * Client-supplied ids are never trusted: a syntactically valid id pointing at a
 * deleted category must fail as a 400, not create an orphan product.
 *
 * @param values - Validated form values.
 * @throws {ApiError} 400 when a reference cannot be resolved.
 */
async function assertReferencesExist(values: ProductFormValues): Promise<void> {
  const [category, brand] = await Promise.all([
    Category.exists({ _id: values.category }),
    values.brand ? Brand.exists({ _id: values.brand }) : Promise.resolve(true),
  ]);
  if (!category) throw ApiError.badRequest('Selected category no longer exists');
  if (!brand) throw ApiError.badRequest('Selected brand no longer exists');
}

/**
 * Recomputes and stores a product's cached rating aggregates from its approved
 * reviews. Called after any review is approved, rejected or deleted.
 *
 * @param productId - The product's ObjectId.
 */
export async function refreshProductRating(productId: string): Promise<void> {
  const [summary] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { product: new Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: summary ? Math.round(summary.average * 10) / 10 : 0,
    ratingCount: summary?.count ?? 0,
  });
}
