/**
 * Tracks whether the page has been scrolled past a threshold.
 *
 * @module hooks/useScrolled
 */
import { useEffect, useState } from 'react';

/**
 * Reports whether the window has scrolled beyond `threshold` pixels.
 *
 * Used by the storefront header to switch from its transparent resting state to
 * its condensed, elevated one.
 *
 * @param threshold - Scroll offset in pixels at which the state flips.
 * @returns `true` once the page is scrolled past the threshold.
 *
 * @remarks
 * The listener is passive, so it never blocks scrolling, and it only calls
 * `setState` when the boolean actually changes — a scroll handler that sets
 * state on every frame would re-render the header sixty times a second for no
 * visible benefit.
 *
 * @example
 * ```tsx
 * const isScrolled = useScrolled(8);
 * ```
 */
export function useScrolled(threshold = 8): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function read(): void {
      setIsScrolled((current) => {
        const next = window.scrollY > threshold;
        return next === current ? current : next;
      });
    }

    // Read once on mount: the browser restores scroll position on back
    // navigation, so the page can already be scrolled before the first event.
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [threshold]);

  return isScrolled;
}
