/**
 * Shared API contract types used by both the route handlers and the browser.
 *
 * @module types/api
 */

/** Successful envelope returned by every API route. */
export interface ApiSuccess<TData> {
  success: true;
  data: TData;
  /** Present only on paginated list endpoints. */
  meta?: PaginationMeta;
}

/** Failure envelope returned by every API route. */
export interface ApiFailure {
  success: false;
  error: {
    message: string;
    /** Field-level validation messages, keyed by field path. */
    details?: Record<string, string>;
  };
}

/** Discriminated union of every possible API response. */
export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

/** Pagination information attached to list responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** A page of results plus its pagination metadata. */
export interface Paginated<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}
