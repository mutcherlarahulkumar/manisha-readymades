/**
 * Domain enums and the serialised (JSON) shapes of every entity.
 *
 * These are the types the browser sees: `_id` and dates are strings because
 * they have been through `JSON.stringify`. Mongoose document interfaces live
 * alongside their schemas in `models/`.
 *
 * @module types/models
 */

/* ------------------------------------------------------------------ enums */

/** Roles an admin user can hold. `owner` may manage other admins. */
export const ADMIN_ROLES = ['owner', 'staff'] as const;
/** @see ADMIN_ROLES */
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Publication status controlling storefront visibility of a product. */
export const PRODUCT_STATUSES = ['active', 'inactive'] as const;
/** @see PRODUCT_STATUSES */
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Moderation state of a customer-submitted review. */
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
/** @see REVIEW_STATUSES */
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Lifecycle stages of an internally recorded order. */
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'packing',
  'dispatched',
  'completed',
  'cancelled',
] as const;
/** @see ORDER_STATUSES */
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** What a discount applies to. */
export const DISCOUNT_SCOPES = ['all', 'category', 'brand', 'product'] as const;
/** @see DISCOUNT_SCOPES */
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

/** How a discount reduces the price. */
export const DISCOUNT_TYPES = ['percent', 'flat'] as const;
/** @see DISCOUNT_TYPES */
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** Where a banner is rendered. */
export const BANNER_POSITIONS = ['top', 'hero', 'promo'] as const;
/** @see BANNER_POSITIONS */
export type BannerPosition = (typeof BANNER_POSITIONS)[number];

/** Analytics event kinds recorded from the storefront. */
export const EVENT_TYPES = ['product_view', 'whatsapp_click'] as const;
/** @see EVENT_TYPES */
export type EventType = (typeof EVENT_TYPES)[number];

/** Garment sizes offered. */
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'] as const;
/** @see SIZES */
export type Size = (typeof SIZES)[number];

/* ------------------------------------------------------------ value types */

/** A single image stored in Cloudinary. */
export interface ImageAsset {
  /** Secure delivery URL. */
  url: string;
  /** Cloudinary public id, required to delete the asset later. */
  publicId: string;
  /** Accessible alternative text. */
  alt?: string;
}

/** Fields present on every persisted document once serialised. */
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------------------------------------- records */

/** An admin user of the dashboard. Never includes `passwordHash`. */
export interface Admin extends BaseEntity {
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}

/** A product category, optionally nested under a parent category. */
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  /** Parent category id, or `null` for a top-level category. */
  parent: string | null;
  description?: string;
  image?: ImageAsset;
  sortOrder: number;
  isActive: boolean;
}

/** A category with its populated parent, as returned by list endpoints. */
export interface CategoryWithParent extends Omit<Category, 'parent'> {
  parent: Pick<Category, '_id' | 'name' | 'slug'> | null;
}

/** A clothing brand. */
export interface Brand extends BaseEntity {
  name: string;
  slug: string;
  logo?: ImageAsset;
  isActive: boolean;
}

/** A sellable product. */
export interface Product extends BaseEntity {
  /** Sequential business key in the form `SKL00001`. Immutable once assigned. */
  sku: string;
  name: string;
  slug: string;
  description?: string;
  brand: string | null;
  category: string;
  colors: string[];
  sizes: Size[];
  images: ImageAsset[];
  /** Base wholesale price in INR, before any discount. */
  price: number;
  status: ProductStatus;
  isFeatured: boolean;
  /** Mean of approved review ratings, 0 when there are none. */
  ratingAverage: number;
  /** Number of approved reviews. */
  ratingCount: number;
}

/** A product with its brand and category populated, plus resolved pricing. */
export interface ProductListItem extends Omit<Product, 'brand' | 'category'> {
  brand: Pick<Brand, '_id' | 'name' | 'slug'> | null;
  category: Pick<Category, '_id' | 'name' | 'slug'>;
  pricing: ResolvedPricing;
}

/** The outcome of applying the best available discount to a product's price. */
export interface ResolvedPricing {
  /** Undiscounted price. */
  basePrice: number;
  /** Price after the best applicable discount; equals `basePrice` when none applies. */
  finalPrice: number;
  /** Absolute amount saved, rounded to whole rupees. */
  discountAmount: number;
  /** Percentage saved, rounded to the nearest whole number. */
  discountPercent: number;
  /** Title of the applied discount, for the storefront badge. */
  appliedDiscountTitle: string | null;
}

/** A moderated, text-only customer review. */
export interface Review extends BaseEntity {
  product: string;
  customerName: string;
  /** Integer from 1 to 5. */
  rating: number;
  comment: string;
  status: ReviewStatus;
}

/** A review with a minimal product reference, for the moderation queue. */
export interface ReviewWithProduct extends Omit<Review, 'product'> {
  product: Pick<Product, '_id' | 'name' | 'sku' | 'slug'> | null;
}

/** A price reduction rule applied at read time. */
export interface Discount extends BaseEntity {
  title: string;
  description?: string;
  scope: DiscountScope;
  /** Ids of the categories, brands or products targeted. Empty when scope is `all`. */
  targetIds: string[];
  type: DiscountType;
  /** Percentage (1–90) when `type` is `percent`, otherwise rupees off. */
  value: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

/** A promotional banner shown on the storefront. */
export interface Banner extends BaseEntity {
  title: string;
  subtitle?: string;
  image: ImageAsset;
  /** Internal or external destination; empty when the banner is not clickable. */
  link?: string;
  position: BannerPosition;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

/** An order captured manually by an admin. Never exposed publicly. */
export interface Order extends BaseEntity {
  /** Sequential business key in the form `ORD00001`. */
  orderNo: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  orderDate: string;
  remarks?: string;
  /** Screenshots, photos or PDFs evidencing the order. */
  attachments: ImageAsset[];
  status: OrderStatus;
  assignedTo: string | null;
}

/** An order with its assignee populated. */
export interface OrderWithAssignee extends Omit<Order, 'assignedTo'> {
  assignedTo: Pick<Admin, '_id' | 'name'> | null;
}

/** A storefront interaction recorded for analytics. */
export interface AnalyticsEvent extends BaseEntity {
  type: EventType;
  product: string | null;
}
