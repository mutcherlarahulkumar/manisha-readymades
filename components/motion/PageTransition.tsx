/**
 * The transition played when a new route renders.
 *
 * @module components/motion/PageTransition
 */
import { m, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import { DURATION, EASE } from '@/theme/motion';

/** Props for {@link PageTransition}. */
interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Cross-fades page content on navigation.
 *
 * @remarks
 * Two deliberate constraints, both of which rule out the more elaborate page
 * transitions this could have been:
 *
 * 1. **Opacity only, never `transform`.** A transformed ancestor becomes the
 *    containing block for every `position: fixed` descendant, which would
 *    silently re-anchor the mobile enquiry bar and any fixed overlay to this
 *    wrapper instead of to the viewport. Fading costs nothing and has no such
 *    side effect.
 * 2. **No exit animation.** Waiting for the outgoing page to fade out before
 *    the incoming one starts adds its full duration to every navigation, and
 *    the site would measurably feel slower in exchange for an effect nobody
 *    asked for. Keying on the route makes the new page fade in on arrival.
 *
 * @param props - The page content.
 * @returns The page wrapped in its transition.
 */
export function PageTransition({ children }: PageTransitionProps): JSX.Element {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <>{children}</>;

  return (
    <m.div
      key={router.asPath}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.fast, ease: EASE.standard }}
    >
      {children}
    </m.div>
  );
}
