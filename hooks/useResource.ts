/**
 * Data-fetching hooks for the admin dashboard.
 *
 * Wraps SWR so every admin list shares the same caching, revalidation and
 * error-shape behaviour, and so components read `isLoading`/`error`/`data`
 * rather than assembling requests themselves.
 *
 * @module hooks/useResource
 */
import useSWR, { mutate as globalMutate, type SWRConfiguration } from 'swr';

import { fetcher } from '@/lib/http';

/** What every resource hook returns. */
export interface ResourceState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  error: unknown;
  /** Re-fetches this resource. */
  refresh: () => Promise<TData | undefined>;
}

/** Options shared by admin lists: no refetch on window focus, which is jarring mid-edit. */
const DEFAULT_OPTIONS: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

/**
 * Fetches a resource from the API.
 *
 * @typeParam TData - Expected payload shape.
 * @param path - API path, or `null` to skip the request (e.g. while an id is unknown).
 * @param options - SWR overrides.
 * @returns The request state and a refresh function.
 *
 * @example
 * ```ts
 * const { data: products, isLoading, error, refresh } = useResource<ProductListItem[]>(
 *   '/api/products?limit=60',
 * );
 * ```
 */
export function useResource<TData>(
  path: string | null,
  options: SWRConfiguration = {},
): ResourceState<TData> {
  const { data, error, isLoading, mutate } = useSWR<TData>(path, fetcher, {
    ...DEFAULT_OPTIONS,
    ...options,
  });

  return {
    data,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Invalidates every cached request whose key starts with the given prefix.
 *
 * Used after a mutation so related lists (for example `/api/products` and
 * `/api/products?status=active`) all reload.
 *
 * @param prefix - Path prefix to invalidate, e.g. `/api/products`.
 */
export async function invalidate(prefix: string): Promise<void> {
  await globalMutate(
    (key) => typeof key === 'string' && key.startsWith(prefix),
    undefined,
    { revalidate: true },
  );
}
