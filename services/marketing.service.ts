/**
 * Discount, banner and review business logic.
 *
 * @module services/marketing.service
 */
import type { FilterQuery } from 'mongoose';

import { ApiError } from '@/lib/api/ApiError';
import { serialize } from '@/lib/serialize';
import { Banner, type BannerDocument } from '@/models/Banner';
import { Discount, type DiscountDocument } from '@/models/Discount';
import { Product } from '@/models/Product';
import { Review, type ReviewDocument } from '@/models/Review';
import { refreshProductRating } from '@/services/product.service';
import type {
  Banner as BannerJson,
  Discount as DiscountJson,
  Review as ReviewJson,
  ReviewStatus,
  ReviewWithProduct,
} from '@/types/models';
import type { BannerFormValues, DiscountFormValues, ReviewFormValues } from '@/validation/marketing.schema';

/* -------------------------------------------------------------- discounts */

/**
 * Lists every discount, newest first.
 *
 * @returns All discount rules.
 */
export async function listDiscounts(): Promise<DiscountJson[]> {
  const docs = await Discount.find().sort({ createdAt: -1 }).lean();
  return serialize<DiscountJson[]>(docs);
}

/**
 * Fetches one discount by id.
 *
 * @param id - The discount's ObjectId.
 * @returns The discount.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getDiscount(id: string): Promise<DiscountJson> {
  const doc = await Discount.findById(id).lean<DiscountDocument | null>();
  if (!doc) throw ApiError.notFound('Discount');
  return serialize<DiscountJson>(doc);
}

/**
 * Creates a discount rule.
 *
 * @param values - Validated form values.
 * @returns The created discount.
 */
export async function createDiscount(values: DiscountFormValues): Promise<DiscountJson> {
  const created = await Discount.create(values);
  return serialize<DiscountJson>(created.toObject());
}

/**
 * Updates a discount rule.
 *
 * @param id - The discount's ObjectId.
 * @param values - Validated form values.
 * @returns The updated discount.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function updateDiscount(id: string, values: DiscountFormValues): Promise<DiscountJson> {
  const doc = await Discount.findById(id);
  if (!doc) throw ApiError.notFound('Discount');

  doc.set(values);
  await doc.save();
  return serialize<DiscountJson>(doc.toObject());
}

/**
 * Deletes a discount rule. Prices revert on the next read.
 *
 * @param id - The discount's ObjectId.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function deleteDiscount(id: string): Promise<void> {
  const deleted = await Discount.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound('Discount');
}

/* ---------------------------------------------------------------- banners */

/**
 * Lists banners.
 *
 * @param options.visibleOnly - Restrict to banners currently within their
 *   schedule and marked active (storefront).
 * @returns Banners in display order.
 */
export async function listBanners(options: { visibleOnly?: boolean } = {}): Promise<BannerJson[]> {
  const filter: FilterQuery<BannerDocument> = {};

  if (options.visibleOnly) {
    const now = new Date();
    filter.isActive = true;
    filter.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  }

  const docs = await Banner.find(filter).sort({ createdAt: -1 }).lean();
  return serialize<BannerJson[]>(docs);
}

/**
 * Fetches one banner by id.
 *
 * @param id - The banner's ObjectId.
 * @returns The banner.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getBanner(id: string): Promise<BannerJson> {
  const doc = await Banner.findById(id).lean<BannerDocument | null>();
  if (!doc) throw ApiError.notFound('Banner');
  return serialize<BannerJson>(doc);
}

/**
 * Saves the banner for a slot, replacing whatever occupied it.
 *
 * @param values - Validated form values, including the target position.
 * @returns The stored banner.
 *
 * @remarks
 * There is exactly one announcement bar and one hero, so "create" and "update"
 * are the same operation: write the slot. Modelling it as an upsert removes the
 * whole class of confusion the old list produced, where several banners could
 * claim the same position and only the first happened to render.
 */
export async function saveBanner(values: BannerFormValues): Promise<BannerJson> {
  const existing = await Banner.findOne({ position: values.position });

  if (!existing) {
    const created = await Banner.create(values);
    return serialize<BannerJson>(created.toObject());
  }

  // `set` then `save` rather than `findOneAndUpdate`, so the pre-validate hook
  // that enforces the per-slot rules actually runs.
  existing.set(values);
  await existing.save();
  return serialize<BannerJson>(existing.toObject());
}

/**
 * Updates a banner.
 *
 * @param id - The banner's ObjectId.
 * @param values - Validated form values.
 * @returns The updated banner.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function updateBanner(id: string, values: BannerFormValues): Promise<BannerJson> {
  const doc = await Banner.findById(id);
  if (!doc) throw ApiError.notFound('Banner');

  doc.set(values);
  await doc.save();
  return serialize<BannerJson>(doc.toObject());
}

/**
 * Deletes a banner.
 *
 * @param id - The banner's ObjectId.
 * @returns The public id of its image, for Cloudinary cleanup.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function deleteBanner(id: string): Promise<{ publicIds: string[] }> {
  const doc = await Banner.findByIdAndDelete(id).lean<BannerDocument | null>();
  if (!doc) throw ApiError.notFound('Banner');
  // Only the hero holds an image, so there may be nothing to clean up.
  return { publicIds: doc.image ? [doc.image.publicId] : [] };
}

/* ---------------------------------------------------------------- reviews */

/**
 * Lists reviews for the admin moderation queue.
 *
 * @param options.status - Restrict to a single moderation status.
 * @param options.productId - Restrict to one product.
 * @returns Matching reviews with a minimal product reference.
 */
export async function listReviews(
  options: { status?: ReviewStatus; productId?: string } = {},
): Promise<ReviewWithProduct[]> {
  const filter: FilterQuery<ReviewDocument> = {};
  if (options.status) filter.status = options.status;
  if (options.productId) filter.product = options.productId;

  const docs = await Review.find(filter)
    .populate('product', 'name sku slug')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return serialize<ReviewWithProduct[]>(docs);
}

/**
 * Lists the approved reviews shown publicly on a product page.
 *
 * @param productId - The product's ObjectId.
 * @returns Approved reviews, newest first.
 */
export async function listApprovedReviews(productId: string): Promise<ReviewJson[]> {
  const docs = await Review.find({ product: productId, status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return serialize<ReviewJson[]>(docs);
}

/**
 * Records a visitor's review. It is held as `pending` until an admin approves
 * it, so nothing a stranger writes appears on the site unreviewed.
 *
 * @param productId - The product being reviewed.
 * @param values - Validated form values.
 * @returns The created review.
 * @throws {ApiError} 404 when the product does not exist or is not published.
 */
export async function createReview(
  productId: string,
  values: ReviewFormValues,
): Promise<ReviewJson> {
  const product = await Product.exists({ _id: productId, status: 'active' });
  if (!product) throw ApiError.notFound('Product');

  const created = await Review.create({ ...values, product: productId, status: 'pending' });
  return serialize<ReviewJson>(created.toObject());
}

/**
 * Approves or rejects a review and refreshes the product's rating aggregates.
 *
 * @param id - The review's ObjectId.
 * @param status - The moderation decision.
 * @returns The updated review.
 * @throws {ApiError} 404 when the review does not exist.
 */
export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<ReviewJson> {
  const doc = await Review.findByIdAndUpdate(id, { status }, { new: true }).lean<ReviewDocument | null>();
  if (!doc) throw ApiError.notFound('Review');

  await refreshProductRating(doc.product.toString());
  return serialize<ReviewJson>(doc);
}

/**
 * Deletes a review and refreshes the product's rating aggregates.
 *
 * @param id - The review's ObjectId.
 * @throws {ApiError} 404 when the review does not exist.
 */
export async function deleteReview(id: string): Promise<void> {
  const doc = await Review.findByIdAndDelete(id).lean<ReviewDocument | null>();
  if (!doc) throw ApiError.notFound('Review');
  await refreshProductRating(doc.product.toString());
}
