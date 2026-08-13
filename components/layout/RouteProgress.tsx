/**
 * Navigation progress indicator.
 *
 * @module components/layout/RouteProgress
 */
import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * A thin bar that runs across the top of the viewport while a route loads.
 *
 * @returns The progress bar, or `null` when no navigation is in flight.
 *
 * @remarks
 * Every storefront page is server-rendered, so a click spends real time waiting
 * on the server before anything changes on screen. Without this, that gap looks
 * like a dead link and invites a second click.
 *
 * The bar only appears after a short delay. Most navigations resolve in well
 * under that, and flashing a progress bar for 80ms reads as a glitch rather
 * than as feedback — so fast navigations show nothing at all, which is the
 * correct impression of "instant".
 *
 * It animates width, which is a layout property and normally avoided. It is
 * acceptable here precisely because the element is a fixed-position, one-pixel-
 * tall bar with no siblings and no descendants: there is no subtree for the
 * reflow to cascade into.
 */
export function RouteProgress(): JSX.Element | null {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    function start(): void {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsVisible(true), 180);
    }

    function done(): void {
      window.clearTimeout(timer);
      setIsVisible(false);
    }

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);

    return () => {
      window.clearTimeout(timer);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router.events]);

  if (!isVisible) return null;

  return (
    <Box
      role="progressbar"
      aria-label="Loading page"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        // Above the header, which is itself sticky.
        zIndex: (theme) => theme.zIndex.appBar + 2,
        bgcolor: 'transparent',
        pointerEvents: 'none',
        '&::after': {
          content: '""',
          display: 'block',
          height: '100%',
          width: '100%',
          transformOrigin: 'left',
          background: 'linear-gradient(90deg, #1F3A8A 0%, #4661B8 60%, #F59E0B 100%)',
          // Eases toward the right without ever arriving: the real completion
          // is the route change itself, and a bar that reached 100% early would
          // be lying about it.
          animation: 'route-progress 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        },
        '@keyframes route-progress': {
          '0%': { transform: 'scaleX(0.02)' },
          '45%': { transform: 'scaleX(0.55)' },
          '100%': { transform: 'scaleX(0.92)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&::after': { animation: 'none', transform: 'scaleX(0.6)' },
        },
      }}
    />
  );
}
