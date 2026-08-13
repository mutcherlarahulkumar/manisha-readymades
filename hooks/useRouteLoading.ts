/**
 * Tracks in-flight navigation to the current page.
 *
 * @module hooks/useRouteLoading
 */
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Reports whether a navigation is currently loading.
 *
 * @param samePageOnly - When true, only reports navigations that stay on the
 * current route — a filter or pagination change rather than a move to a
 * different page.
 * @returns `true` while the matching navigation is in flight.
 *
 * @remarks
 * Every storefront list is server-rendered, so changing a filter is a round
 * trip during which the old results stay on screen, unchanged and now wrong.
 * Swapping them for placeholders makes it obvious that the answer is being
 * recalculated, rather than leaving the visitor to wonder whether their click
 * registered.
 *
 * `samePageOnly` exists because a full page change is already covered by the
 * route progress bar; showing a skeleton for it as well would mean two
 * competing loading indicators for the same event.
 */
export function useRouteLoading(samePageOnly = true): boolean {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function start(url: string): void {
      if (samePageOnly) {
        const target = url.split('?')[0] ?? url;
        const current = router.asPath.split('?')[0] ?? router.asPath;
        if (target !== current) return;
      }
      setIsLoading(true);
    }

    function done(): void {
      setIsLoading(false);
    }

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router.events, router.asPath, samePageOnly]);

  return isLoading;
}
