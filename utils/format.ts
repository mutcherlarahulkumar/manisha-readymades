/**
 * Display formatting helpers.
 *
 * Centralised so prices, dates and labels read the same on every screen.
 *
 * @module utils/format
 */
import type { OrderStatus, ProductStatus, ReviewStatus } from '@/types/models';

/** Indian rupee formatter, without decimal places for whole-rupee wholesale pricing. */
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Day-month-year formatter matching Indian convention. */
const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Formats a rupee amount for display.
 *
 * @param amount - Amount in whole rupees.
 * @returns The formatted string, e.g. `₹1,299`.
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/**
 * Formats an ISO date string for display.
 *
 * @param iso - An ISO 8601 date string.
 * @returns The formatted date, or an em dash when the input is empty.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/**
 * Converts an ISO date string into the `YYYY-MM-DD` value a native date input
 * expects.
 *
 * @param iso - An ISO 8601 date string.
 * @returns The date portion, or an empty string when the input is invalid.
 */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** MUI palette colours used for each order status chip. */
export const ORDER_STATUS_COLOR: Record<
  OrderStatus,
  'warning' | 'info' | 'secondary' | 'primary' | 'success' | 'error'
> = {
  pending: 'warning',
  processing: 'info',
  packing: 'secondary',
  dispatched: 'primary',
  completed: 'success',
  cancelled: 'error',
};

/** Human-readable label for each order status. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packing: 'Packing',
  dispatched: 'Dispatched',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Human-readable label for each product status. */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

/** Human-readable label for each review moderation status. */
export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

/**
 * Truncates text to a maximum length, appending an ellipsis when shortened.
 *
 * @param value - The source text.
 * @param max - Maximum characters to keep.
 * @returns The possibly shortened text.
 */
export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
