/**
 * Scroll-triggered entrance animations.
 *
 * These components are the only sanctioned way to animate an element into view.
 * Pages compose them instead of writing their own `motion.div` variants, which
 * is what keeps every reveal on the site running at the same speed and the same
 * curve.
 *
 * Each wrapper is a motion-enabled MUI `Box`, so it accepts `sx` and can be the
 * grid or flex container itself rather than an extra layout node wrapped around
 * one.
 *
 * Reduced motion is handled here, once, rather than at every call site: when
 * the visitor's system asks for less motion, the wrappers render as plain boxes
 * in the final state. Nothing is ever left hidden, because a missed
 * `IntersectionObserver` callback in a no-animation mode would mean invisible
 * content.
 *
 * @module components/motion/Reveal
 */
import Box, { type BoxProps } from '@mui/material/Box';
import { m, useReducedMotion, type MotionProps, type Variants } from 'framer-motion';
import type { ComponentType, ElementType, ReactNode } from 'react';

import { DURATION, EASE, VIEWPORT, fadeRise, staggerContainer } from '@/theme/motion';

/**
 * An MUI `Box` that Framer Motion can drive.
 *
 * @remarks
 * Created once at module scope. Calling `motion.create` inside a component
 * would produce a new component type on every render, which remounts the whole
 * subtree and throws away its animation state.
 *
 * The cast restores `component`, which `motion.create` drops: `Box` is
 * polymorphic through MUI's `OverridableComponent`, a shape Framer's wrapper
 * types collapse to the default `div` props. The runtime behaviour is
 * unaffected — the prop is still forwarded to `Box` — so this only re-states
 * what the underlying component already accepts.
 */
const MotionBox = m.create(Box) as ComponentType<
  BoxProps & MotionProps & { component?: ElementType }
>;

/** Props shared by every reveal wrapper. */
interface RevealBaseProps {
  children: ReactNode;
  /** Rendered element. Use a semantic tag where one applies, e.g. `"section"`. */
  component?: ElementType;
  /** Styles for the wrapper, which is a real layout box. */
  sx?: BoxProps['sx'];
  className?: string;
}

/** Props for {@link Reveal}. */
interface RevealProps extends RevealBaseProps {
  /** Seconds to wait before animating. Keep under ~0.3s. */
  delay?: number;
  /**
   * Fade without movement. Use for elements whose position is load-bearing,
   * such as an image already anchored to a grid line.
   */
  fadeOnly?: boolean;
}

/**
 * Fades and rises its children when they scroll into view.
 *
 * @param props - Content, timing and styling.
 * @returns The animated wrapper.
 *
 * @example
 * ```tsx
 * <Reveal component="section">
 *   <Typography variant="h2">Featured Products</Typography>
 * </Reveal>
 * ```
 */
export function Reveal({
  children,
  component = 'div',
  sx,
  className,
  delay = 0,
  fadeOnly = false,
}: RevealProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Box component={component} sx={sx} className={className}>
        {children}
      </Box>
    );
  }

  const variants: Variants = fadeOnly
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.standard, delay } },
      }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.base, ease: EASE.standard, delay },
        },
      };

  return (
    <MotionBox
      component={component}
      sx={sx}
      className={className}
      data-reveal

      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </MotionBox>
  );
}

/** Props for {@link RevealGroup}. */
interface RevealGroupProps extends RevealBaseProps {
  /** Seconds between consecutive children starting. */
  stagger?: number;
  /** Seconds before the first child starts. */
  delayChildren?: number;
}

/**
 * Sequences its {@link RevealItem} children as the group enters the viewport.
 *
 * Put this on the grid or list container itself and wrap each child in
 * {@link RevealItem}. The container owns the timing, so adding or removing
 * items never requires recalculating individual delays.
 *
 * @param props - Content, timing and styling.
 * @returns The animated container.
 *
 * @example
 * ```tsx
 * <RevealGroup sx={{ display: 'grid', gap: 2 }}>
 *   {products.map((product) => (
 *     <RevealItem key={product._id}>
 *       <ProductCard product={product} />
 *     </RevealItem>
 *   ))}
 * </RevealGroup>
 * ```
 */
export function RevealGroup({
  children,
  component = 'div',
  sx,
  className,
  stagger = 0.06,
  delayChildren = 0,
}: RevealGroupProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Box component={component} sx={sx} className={className}>
        {children}
      </Box>
    );
  }

  return (
    <MotionBox
      component={component}
      sx={sx}
      className={className}
      data-reveal

      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </MotionBox>
  );
}

/** Props for {@link RevealItem}. */
type RevealItemProps = RevealBaseProps;

/**
 * A single child of a {@link RevealGroup}.
 *
 * Carries no timing of its own — the parent's stagger drives it.
 *
 * @param props - Content and styling.
 * @returns The animated item.
 */
export function RevealItem({
  children,
  component = 'div',
  sx,
  className,
}: RevealItemProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Box component={component} sx={sx} className={className}>
        {children}
      </Box>
    );
  }

  return (
    <MotionBox component={component} sx={sx} className={className} data-reveal variants={fadeRise}>
      {children}
    </MotionBox>
  );
}

/** Props for {@link ImageReveal}. */
interface ImageRevealProps extends RevealBaseProps {
  /** Seconds to wait before revealing. */
  delay?: number;
}

/**
 * Reveals an image by wiping a mask upward while the image itself settles from
 * a slight scale.
 *
 * @remarks
 * The mask is a `clip-path` inset, not a change of `height`, so the image never
 * reflows — only the compositor is involved. The inner scale runs slightly
 * longer than the wipe so the picture is still moving as it is uncovered, which
 * is what makes the two read as one gesture rather than two effects.
 *
 * @param props - The image element, timing and styling.
 * @returns The animated wrapper.
 */
export function ImageReveal({
  children,
  component = 'div',
  sx,
  className,
  delay = 0,
}: ImageRevealProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Box component={component} sx={sx} className={className}>
        {children}
      </Box>
    );
  }

  return (
    <MotionBox
      component={component}
      className={className}
      sx={[{ overflow: 'hidden' }, ...(Array.isArray(sx) ? sx : [sx])]}
      data-reveal

      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.slow, ease: EASE.emphasised, delay }}
    >
      <m.div
        style={{ height: '100%' }}
        initial={{ scale: 1.08 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: DURATION.slow + 0.2, ease: EASE.emphasised, delay }}
      >
        {children}
      </m.div>
    </MotionBox>
  );
}
