/**
 * Incremental loading for paginated list endpoints.
 *
 * @module hooks/useInfiniteList
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { request } from '@/lib/http';
import type { PaginationMeta } from '@/types/api';

/** What {@link useInfiniteList} returns to the view. */
interface InfiniteList<TItem> {
  /** Every item loaded so far, in order. */
  items: TItem[];
  /** Pagination metadata from the most recent response. */
  meta: PaginationMeta;
  /** True while a page request is in flight. */
  isLoadingMore: boolean;
  /** The thrown value from the last failed request, if any. */
  error: unknown;
  /** False once the final page has been loaded. */
  hasMore: boolean;
  /** Loads the next page. Safe to call redundantly; it no-ops when busy. */
  loadMore: () => void;
  /**
   * Attach to a sentinel element placed after the list. When it scrolls into
   * view, the next page loads.
   */
  sentinelRef: (node: HTMLElement | null) => void;
}

/**
 * Loads successive pages of a list endpoint, appending as it goes.
 *
 * @typeParam TItem - The list item type.
 * @param path - API path, e.g. `/api/brands`.
 * @param initialItems - The first page, already rendered by the server.
 * @param initialMeta - Pagination metadata for that first page.
 * @returns The accumulated list and its loading controls.
 *
 * @remarks
 * The first page always comes from the server, so the list is complete in the
 * initial HTML and indexable; this hook only ever fetches page two onwards.
 *
 * Requests are guarded by a ref rather than by the `isLoadingMore` state.
 * `IntersectionObserver` can fire several times before React commits a state
 * update, and a state guard would let those duplicates through — appending the
 * same page two or three times over.
 *
 * A failed page does not retry automatically. The observer would otherwise sit
 * on a broken endpoint hammering it once per scroll event; instead the error is
 * surfaced so the view can offer a retry the visitor controls.
 */
export function useInfiniteList<TItem>(
  path: string,
  initialItems: TItem[],
  initialMeta: PaginationMeta,
): InfiniteList<TItem> {
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const isFetchingRef = useRef(false);
  const metaRef = useRef(initialMeta);

  // The sentinel is held in state, not a ref, so that attaching it re-runs the
  // effect below. A ref would not trigger one, and the observer has to be
  // created after the node exists.
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  // Server-rendered navigation replaces the props; reset rather than appending
  // a new list's first page onto the previous one's items.
  useEffect(() => {
    setItems(initialItems);
    setMeta(initialMeta);
    metaRef.current = initialMeta;
    setError(undefined);
  }, [initialItems, initialMeta]);

  const hasMore = meta.page < meta.totalPages;

  const loadMore = useCallback((): void => {
    const current = metaRef.current;
    if (isFetchingRef.current || current.page >= current.totalPages) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setError(undefined);

    void (async () => {
      try {
        const next = await request<TItem[]>(path, {
          anonymous: true,
          query: { page: current.page + 1, limit: current.limit },
        });
        setItems((previous) => [...previous, ...next.data]);
        if (next.meta) {
          metaRef.current = next.meta;
          setMeta(next.meta);
        }
      } catch (thrown) {
        setError(thrown);
      } finally {
        isFetchingRef.current = false;
        setIsLoadingMore(false);
      }
    })();
  }, [path]);

  const sentinelRef = useCallback((node: HTMLElement | null): void => {
    setSentinel(node);
  }, []);

  /*
   * One effect owns the observer's entire lifecycle: it creates it, and its
   * cleanup disconnects it.
   *
   * This was previously split — the callback ref created the observer while a
   * mount-only effect disconnected it — which React's StrictMode broke
   * silently. StrictMode simulates an unmount immediately after mounting, so
   * that cleanup ran and disconnected the observer moments after the ref had
   * created it. The ref never fired again, so automatic loading was dead while
   * the "Load more" button, calling the same function directly, still worked.
   * Keeping creation and teardown in one effect makes the double-invoke
   * harmless: it simply builds the observer again.
   */
  useEffect(() => {
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      // Begins loading before the sentinel is actually on screen, so the next
      // page is usually in place by the time the visitor reaches it.
      { rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, loadMore]);

  return { items, meta, isLoadingMore, error, hasMore, loadMore, sentinelRef };
}
