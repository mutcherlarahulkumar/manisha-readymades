/**
 * The application's motion vocabulary.
 *
 * Every animation in the UI is composed from the presets here rather than from
 * ad-hoc numbers, so a fade on the home page and a fade in the product grid
 * take exactly the same time and follow exactly the same curve. That
 * consistency is what makes motion read as part of the design rather than as
 * decoration bolted on afterwards.
 *
 * Two rules govern everything in this module:
 *
 * 1. **Only `transform` and `opacity` are animated.** Both are composited by
 *    the GPU, so they never trigger layout or paint. Animating `width`,
 *    `height`, `top` or `left` would.
 * 2. **Motion is short.** Nothing here runs longer than 600ms, and most
 *    transitions land between 200ms and 450ms. Slow interfaces feel cheap, not
 *    luxurious.
 *
 * Reduced-motion is handled at the component boundary — see
 * `components/motion/Reveal` — so these variants stay declarative.
 *
 * @module theme/motion
 */
import type { Transition, Variants } from 'framer-motion';

/**
 * Duration scale, in seconds (Framer Motion's unit).
 *
 * @remarks
 * `fast` is for state changes the user caused directly and expects to feel
 * instant — a hover, a press. `base` is the workhorse for entrances. `slow` is
 * reserved for large elements such as the hero, where a longer travel distance
 * needs a longer time to avoid looking abrupt.
 */
export const DURATION = {
  fast: 0.18,
  base: 0.42,
  slow: 0.6,
} as const;

/**
 * Easing curves.
 *
 * @remarks
 * `standard` is a gentle ease-out: fast at the start, settling softly. It suits
 * elements arriving on screen, because the eye tracks the settle rather than the
 * launch. `emphasised` overshoots slightly less than a spring while still
 * feeling alive, and is used for elements that should draw attention.
 */
export const EASE = {
  standard: [0.22, 1, 0.36, 1],
  emphasised: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

/** The transition applied to entrance animations unless a preset overrides it. */
export const TRANSITION: Transition = {
  duration: DURATION.base,
  ease: EASE.standard,
};

/** A short transition for hover and press feedback. */
export const TRANSITION_FAST: Transition = {
  duration: DURATION.fast,
  ease: EASE.standard,
};

/**
 * Distance in pixels that entering elements travel.
 *
 * @remarks
 * Deliberately small. A 16px rise reads as the element settling into place; a
 * 60px rise reads as the page being assembled in front of the user, which is
 * the tell of an over-animated site.
 */
export const RISE_DISTANCE = 16;

/**
 * The default entrance: fade in while rising a short distance.
 *
 * Used for headings, paragraphs, and any standalone block entering the
 * viewport.
 */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: RISE_DISTANCE },
  visible: { opacity: 1, y: 0, transition: TRANSITION },
};

/** A plain cross-fade, for elements where movement would be distracting. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION },
};

/**
 * The hero's entrance: a longer rise over a longer duration.
 *
 * @remarks
 * Separate from {@link fadeRise} because the hero is physically much larger.
 * Matching the small elements' 16px travel would make it look static.
 */
export const heroRise: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.emphasised },
  },
};

/**
 * Builds a container variant that sequences its children.
 *
 * @param stagger - Seconds between each child starting. Keep this small: at
 * more than ~0.08s a twelve-item grid takes over a second to finish, and the
 * last row appears to lag.
 * @param delayChildren - Seconds to wait before the first child starts.
 * @returns Variants to spread onto the parent element.
 *
 * @example
 * ```tsx
 * <motion.div variants={staggerContainer()} initial="hidden" animate="visible">
 *   <motion.div variants={fadeRise} />
 *   <motion.div variants={fadeRise} />
 * </motion.div>
 * ```
 */
export function staggerContainer(stagger = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/**
 * The viewport configuration shared by every scroll-triggered animation.
 *
 * @remarks
 * `once` matters: re-animating on every scroll direction change is the single
 * most irritating pattern in animated sites. The negative bottom margin holds
 * the animation back until the element is genuinely in view rather than firing
 * the instant its top edge crosses the fold.
 */
export const VIEWPORT = { once: true, amount: 0.15, margin: '0px 0px -80px 0px' } as const;

/**
 * Hover and press feedback for cards and tiles.
 *
 * @remarks
 * The lift is 4px and the press returns to 0. Larger values turn a product card
 * into a toy; this is meant to feel like paper responding to a fingertip.
 */
export const cardHover = {
  rest: { y: 0 },
  hover: { y: -4, transition: TRANSITION_FAST },
  tap: { y: -1, transition: { duration: 0.1 } },
} as const;
