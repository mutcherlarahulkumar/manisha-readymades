/**
 * Visual design tokens: radius, elevation, layout metrics and surface colours.
 *
 * `theme/spacing` owns the spacing contract. This module owns everything else
 * that must stay consistent between components — the values that, when a
 * component invents its own, make an interface look assembled rather than
 * designed.
 *
 * Nothing in the UI should hard-code a border radius, a `box-shadow` string or
 * a header offset. Import from here instead.
 *
 * @module theme/tokens
 */

/**
 * Corner radius scale, in pixels.
 *
 * @remarks
 * Three steps, and they are not interchangeable. `sm` is for elements that sit
 * inside another rounded surface — a thumbnail inside a card — where matching
 * the parent's radius would look like a mistake. `md` is the default for cards,
 * inputs and buttons. `lg` is reserved for full-bleed surfaces such as the hero
 * image, where the radius has to scale with the element to stay visible.
 * `pill` is for chips and badges only.
 */
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Elevation scale.
 *
 * @remarks
 * Each level is two shadows: a tight, near-opaque one for the contact edge and
 * a wide, faint one for the ambient cast. A single shadow reads as a sticker;
 * the pair reads as an object above a surface. The colour is a desaturated
 * navy rather than black, so shadows sit in the same family as the brand
 * palette instead of muddying it.
 */
export const SHADOW = {
  /** Barely there. For resting cards that need separation without weight. */
  xs: '0 1px 2px rgba(17, 24, 39, 0.04), 0 1px 3px rgba(17, 24, 39, 0.06)',
  /** The default resting elevation for interactive surfaces. */
  sm: '0 1px 2px rgba(17, 24, 39, 0.04), 0 4px 12px rgba(17, 24, 39, 0.06)',
  /** Hover state for cards and tiles. */
  md: '0 2px 4px rgba(17, 24, 39, 0.04), 0 12px 24px rgba(17, 24, 39, 0.09)',
  /** Menus, popovers and the scrolled header. */
  lg: '0 4px 8px rgba(17, 24, 39, 0.04), 0 20px 40px rgba(17, 24, 39, 0.12)',
  /** Dialogs, which must clearly float above a dimmed page. */
  xl: '0 8px 16px rgba(17, 24, 39, 0.06), 0 32px 64px rgba(17, 24, 39, 0.16)',
} as const;

/**
 * Header height at rest and once the page has been scrolled.
 *
 * @remarks
 * The header shrinks on scroll to return vertical space to the content. Both
 * values are exported because sticky elements further down the page — the
 * catalogue's filter sidebar in particular — must offset themselves by the
 * header's height, and a hard-coded guess drifts out of sync the moment the
 * header changes.
 */
export const HEADER_HEIGHT = {
  rest: 72,
  scrolled: 60,
} as const;

/**
 * Height of the announcement strip above the header.
 *
 * @remarks
 * The strip sits *outside* the sticky header and scrolls away with the page, so
 * it deliberately does not contribute to {@link stickyContentTop}. It is
 * exported for the strip's own layout only.
 */
export const ANNOUNCEMENT_HEIGHT = 36;

/** Height of the category navigation strip inside the sticky header. */
export const CATEGORY_STRIP_HEIGHT = 37;

/**
 * The offset a `position: sticky` element needs to clear the header.
 *
 * @param hasCategoryStrip - Whether the category strip is being rendered, which
 * it is only on pages that supply categories to the layout.
 * @returns The `top` value in pixels, including a small breathing gap.
 *
 * @remarks
 * Centralised because the header's height is assembled from several optional
 * parts, and every sticky element on the site has to agree with it. The
 * previous hard-coded guess drifted the moment the header changed, which is
 * exactly the failure this function exists to prevent.
 */
export function stickyContentTop(hasCategoryStrip: boolean): number {
  return HEADER_HEIGHT.scrolled + (hasCategoryStrip ? CATEGORY_STRIP_HEIGHT : 0) + 16;
}

/**
 * Neutral surface and line colours.
 *
 * @remarks
 * Two greys carry most of the interface. `border` is the hairline between
 * surfaces; `borderStrong` is for controls that must read as interactive, such
 * as an unselected filter chip. Keeping them distinct avoids the flat,
 * uniform-outline look that makes an interface hard to scan.
 */
export const SURFACE = {
  /** Page background: a cool off-white that lets white cards read as raised. */
  canvas: '#F7F8FA',
  /** Card and header background. */
  paper: '#FFFFFF',
  /** A subtly tinted surface for secondary blocks and image placeholders. */
  subtle: '#F1F3F7',
  /** Hairline dividers and card outlines. */
  border: '#E6E8EE',
  /** Outlines on interactive controls. */
  borderStrong: '#D3D7E0',
  /** The dark surface used by the footer. */
  inverse: '#0F1B3D',
} as const;

/** Maximum width of the header and footer, wider than the text content column. */
export const SHELL_MAX_WIDTH = 1440;
