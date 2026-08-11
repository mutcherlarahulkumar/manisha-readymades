/**
 * Dashboard analytics: catalogue composition plus product view and WhatsApp
 * enquiry counts derived from the `Event` collection.
 *
 * @module services/analytics.service
 */
import { Types } from 'mongoose';

import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';
import { Event } from '@/models/Event';
import { Product } from '@/models/Product';
import { Review } from '@/models/Review';
import type { EventType } from '@/types/models';

/** A product ranked by an engagement metric. */
export interface RankedProduct {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  count: number;
}

/** A named bucket with a count, used for category and brand breakdowns. */
export interface NamedCount {
  label: string;
  count: number;
}

/** A single day's event total. */
export interface DailyCount {
  date: string;
  count: number;
}

/** Everything the analytics dashboard renders. */
export interface AnalyticsSummary {
  catalogue: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    featuredProducts: number;
    totalCategories: number;
    totalBrands: number;
    pendingReviews: number;
    averagePrice: number;
  };
  productsByCategory: NamedCount[];
  productsByBrand: NamedCount[];
  engagement: {
    /** Product-detail views in the selected window. */
    views: number;
    /** WhatsApp enquiry clicks in the selected window. */
    whatsappClicks: number;
    /** Clicks as a percentage of views. */
    conversionRate: number;
  };
  mostViewed: RankedProduct[];
  mostEnquired: RankedProduct[];
  dailyViews: DailyCount[];
}

/**
 * Ranks products by how often an event type fired for them.
 *
 * @param type - The event type to rank by.
 * @param since - Lower bound on event time.
 * @param limit - Maximum products to return.
 * @returns The top products, highest count first.
 */
async function rankProductsByEvent(
  type: EventType,
  since: Date,
  limit: number,
): Promise<RankedProduct[]> {
  return Event.aggregate<RankedProduct>([
    { $match: { type, product: { $ne: null }, createdAt: { $gte: since } } },
    { $group: { _id: '$product', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    {
      $project: {
        _id: { $toString: '$_id' },
        name: '$product.name',
        sku: '$product.sku',
        slug: '$product.slug',
        count: 1,
      },
    },
  ]);
}

/**
 * Groups product counts by a referenced collection's name field.
 *
 * @param field - The product field holding the reference.
 * @param from - The collection to join against.
 * @returns Counts labelled with the referenced document's name.
 */
async function countProductsBy(field: 'category' | 'brand', from: string): Promise<NamedCount[]> {
  return Product.aggregate<NamedCount>([
    { $match: { [field]: { $ne: null } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $lookup: { from, localField: '_id', foreignField: '_id', as: 'ref' } },
    { $unwind: '$ref' },
    { $project: { _id: 0, label: '$ref.name', count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
}

/**
 * Builds the complete analytics summary.
 *
 * @param days - Size of the engagement window in days, defaults to 30.
 * @returns The dashboard summary.
 */
export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    activeProducts,
    featuredProducts,
    totalCategories,
    totalBrands,
    pendingReviews,
    priceStats,
    productsByCategory,
    productsByBrand,
    eventTotals,
    mostViewed,
    mostEnquired,
    dailyViews,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ isFeatured: true }),
    Category.countDocuments(),
    Brand.countDocuments(),
    Review.countDocuments({ status: 'pending' }),
    Product.aggregate<{ average: number }>([
      { $group: { _id: null, average: { $avg: '$price' } } },
    ]),
    countProductsBy('category', 'categories'),
    countProductsBy('brand', 'brands'),
    Event.aggregate<{ _id: EventType; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    rankProductsByEvent('product_view', since, 8),
    rankProductsByEvent('whatsapp_click', since, 8),
    Event.aggregate<DailyCount>([
      { $match: { type: 'product_view', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } },
    ]),
  ]);

  const views = eventTotals.find((row) => row._id === 'product_view')?.count ?? 0;
  const whatsappClicks = eventTotals.find((row) => row._id === 'whatsapp_click')?.count ?? 0;

  return {
    catalogue: {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      featuredProducts,
      totalCategories,
      totalBrands,
      pendingReviews,
      averagePrice: Math.round(priceStats[0]?.average ?? 0),
    },
    productsByCategory,
    productsByBrand,
    engagement: {
      views,
      whatsappClicks,
      conversionRate: views === 0 ? 0 : Math.round((whatsappClicks / views) * 100),
    },
    mostViewed,
    mostEnquired,
    dailyViews,
  };
}

/**
 * Records a storefront interaction. Failures are swallowed by the caller so a
 * analytics outage can never break the shopping experience.
 *
 * @param type - The interaction kind.
 * @param productId - The product involved, when applicable.
 */
export async function recordEvent(type: EventType, productId: string | null): Promise<void> {
  await Event.create({
    type,
    product: productId ? new Types.ObjectId(productId) : null,
  });
}
