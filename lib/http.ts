/**
 * The browser's only channel to the backend.
 *
 * Every client-side read and write goes through this module, which attaches the
 * admin bearer token, unwraps the shared response envelope, and converts a
 * failure envelope into a typed {@link HttpError}. No component ever calls
 * `fetch` directly, and nothing in the browser touches MongoDB.
 *
 * @module lib/http
 */
import type { ApiResponse, PaginationMeta } from '@/types/api';

/** `localStorage` key holding the admin bearer token. */
export const TOKEN_STORAGE_KEY = 'mr_admin_token';

/** An unsuccessful API call, carrying the server's client-safe message. */
export class HttpError extends Error {
  /** HTTP status code returned by the server. */
  public readonly status: number;
  /** Field-level validation messages, when the server supplied them. */
  public readonly details?: Record<string, string>;

  /**
   * @param status - HTTP status code.
   * @param message - Client-safe message from the server.
   * @param details - Optional field-level validation errors.
   */
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/** A response body plus the pagination metadata that accompanied it. */
export interface PagedResult<TData> {
  data: TData;
  meta: PaginationMeta | undefined;
}

/**
 * Reads the stored admin token.
 *
 * @returns The token, or `null` on the server or when signed out.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Stores the admin token, or clears it when passed `null`.
 *
 * @param token - The token to persist, or `null` to sign out.
 */
export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Options accepted by {@link request}. */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serialisable request body. */
  body?: unknown;
  /** Query parameters; `null`, `undefined` and empty strings are omitted. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Send without the bearer token, for public endpoints. */
  anonymous?: boolean;
}

/**
 * Builds a URL with a query string, skipping empty parameters.
 *
 * @param path - API path beginning with `/api`.
 * @param query - Parameters to append.
 * @returns The full relative URL.
 */
function buildUrl(path: string, query: RequestOptions['query']): string {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    params.append(key, String(value));
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/**
 * Performs an API call and unwraps the response envelope.
 *
 * @typeParam TData - Expected shape of `data` in the success envelope.
 * @param path - API path beginning with `/api`.
 * @param options - Method, body, query parameters and auth behaviour.
 * @returns The unwrapped payload and any pagination metadata.
 * @throws {HttpError} When the server returns a failure envelope or the request
 *   cannot be completed.
 *
 * @example
 * ```ts
 * const { data, meta } = await request<ProductListItem[]>('/api/products', {
 *   query: { page: 2, search: 'vest' },
 * });
 * ```
 */
export async function request<TData>(
  path: string,
  options: RequestOptions = {},
): Promise<PagedResult<TData>> {
  const { method = 'GET', body, query, anonymous = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new HttpError(0, 'Network error. Please check your connection and try again.');
  }

  let payload: ApiResponse<TData> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<TData>;
  } catch {
    // A non-JSON body means something upstream failed before our handler ran.
    throw new HttpError(response.status, 'Unexpected response from the server.');
  }

  if (!response.ok || payload.success === false) {
    const error = payload.success === false ? payload.error : undefined;
    throw new HttpError(
      response.status,
      error?.message ?? 'Request failed. Please try again.',
      error?.details,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

/**
 * Convenience wrapper returning only the payload.
 *
 * @typeParam TData - Expected shape of `data`.
 * @param path - API path.
 * @param options - Request options.
 * @returns The unwrapped payload.
 */
export async function api<TData>(path: string, options: RequestOptions = {}): Promise<TData> {
  const { data } = await request<TData>(path, options);
  return data;
}

/**
 * SWR-compatible fetcher for public and admin GET requests.
 *
 * @typeParam TData - Expected shape of `data`.
 * @param path - API path, used as the SWR cache key.
 * @returns The unwrapped payload.
 */
export function fetcher<TData>(path: string): Promise<TData> {
  return api<TData>(path);
}
