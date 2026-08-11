/**
 * Read-time discount resolution.
 *
 * Products store only their base price. Whenever products are read, the active
 * discounts are loaded once and applied in memory, so a discount takes effect
 * (and expires) with no write to the product collection and no stale data.
 *
 * When several discounts match a product, the one producing the lowest final
 * price wins.
 *
 * @module services/pricing.service
 */
import { Discount, type DiscountDocument } from '@/models/Discount';
import type { ResolvedPricing } from '@/types/models';

/** The product attributes a discount rule is matched against. */
export interface DiscountTarget {
  productId: string;
  categoryId: string;
  brandId: string | null;
  price: number;
}

/**
 * Loads every discount that is enabled and currently within its date window.
 *
 * Call once per request and pass the result to {@link applyDiscounts} for each
 * product, rather than querying per product.
 *
 * @param now - Instant to evaluate the date window against; defaults to now.
 * @returns The active discount rules.
 */
export async function getActiveDiscounts(now: Date = new Date()): Promise<DiscountDocument[]> {
  return Discount.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean<DiscountDocument[]>();
}

/**
 * Determines whether a discount rule applies to a given product.
 *
 * @param discount - The rule under consideration.
 * @param target - The product's identifying attributes.
 * @returns Whether the rule targets this product.
 */
function matches(discount: DiscountDocument, target: DiscountTarget): boolean {
  switch (discount.scope) {
    case 'all':
      return true;
    case 'product':
      return discount.targetIds.some((id) => id.toString() === target.productId);
    case 'category':
      return discount.targetIds.some((id) => id.toString() === target.categoryId);
    case 'brand':
      return target.brandId !== null && discount.targetIds.some((id) => id.toString() === target.brandId);
    default:
      return false;
  }
}

/**
 * Computes the price a discount rule would yield, floored at ₹1.
 *
 * @param discount - The rule to apply.
 * @param price - The base price.
 * @returns The resulting price in whole rupees.
 */
function priceAfter(discount: DiscountDocument, price: number): number {
  const reduced =
    discount.type === 'percent' ? price - (price * discount.value) / 100 : price - discount.value;
  return Math.max(1, Math.round(reduced));
}

/**
 * Applies the best matching discount to a product's price.
 *
 * @param target - The product's price and identifying attributes.
 * @param discounts - Active discounts from {@link getActiveDiscounts}.
 * @returns The resolved pricing, with `finalPrice === basePrice` when nothing applies.
 *
 * @example
 * ```ts
 * const discounts = await getActiveDiscounts();
 * const pricing = applyDiscounts(
 *   { productId, categoryId, brandId, price: 499 },
 *   discounts,
 * );
 * ```
 */
export function applyDiscounts(
  target: DiscountTarget,
  discounts: readonly DiscountDocument[],
): ResolvedPricing {
  let best: { price: number; title: string } | null = null;

  for (const discount of discounts) {
    if (!matches(discount, target)) continue;
    const candidate = priceAfter(discount, target.price);
    if (best === null || candidate < best.price) {
      best = { price: candidate, title: discount.title };
    }
  }

  if (best === null || best.price >= target.price) {
    return {
      basePrice: target.price,
      finalPrice: target.price,
      discountAmount: 0,
      discountPercent: 0,
      appliedDiscountTitle: null,
    };
  }

  const discountAmount = target.price - best.price;
  return {
    basePrice: target.price,
    finalPrice: best.price,
    discountAmount,
    discountPercent: Math.round((discountAmount / target.price) * 100),
    appliedDiscountTitle: best.title,
  };
}
