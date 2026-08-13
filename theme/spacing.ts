/**
 * The single source of truth for spacing across the application.
 *
 * The brief fixes four values, and nothing in the UI may hard-code padding
 * outside this module:
 *
 * | Context | Mobile | Desktop |
 * | ------- | ------ | ------- |
 * | Outer   | 16px   | 24px    |
 * | Inner   | 8px    | 16px    |
 *
 * MUI's spacing unit is 8px, so these map to multiples of `theme.spacing()`:
 * outer = `{ xs: 2, md: 3 }`, inner = `{ xs: 1, md: 2 }`. Import the responsive
 * tokens below rather than writing those numbers by hand.
 *
 * @module theme/spacing
 */
import type { ResponsiveStyleValue } from '@mui/system';

/** Base MUI spacing unit in pixels. */
export const SPACING_UNIT = 8;

/** Raw pixel values, for the rare case a component needs a number. */
export const SPACING_PX = {
  outer: { mobile: 16, desktop: 24 },
  inner: { mobile: 8, desktop: 16 },
} as const;

/**
 * Outer spacing: page gutters, section padding, and the gap between major
 * blocks. 16px on mobile, 24px from the `md` breakpoint up.
 */
export const OUTER_SPACING: ResponsiveStyleValue<number> = { xs: 2, md: 3 };

/**
 * Inner spacing: padding inside cards, list rows, form groups and toolbars, and
 * the gap between related controls. 8px on mobile, 16px from `md` up.
 */
export const INNER_SPACING: ResponsiveStyleValue<number> = { xs: 1, md: 2 };

/**
 * Vertical rhythm between page sections: 48px on mobile, 80px from `md` up.
 *
 * @remarks
 * A multiple of the outer step, so it stays inside the same scale. The gap
 * between sections is the main thing that makes a page feel composed rather
 * than stacked — when it is close to the gap *within* a section, the eye cannot
 * tell where one idea ends and the next begins. Section spacing is therefore
 * kept several times larger than {@link OUTER_SPACING}, and generously so on
 * desktop where there is room for it.
 */
export const SECTION_SPACING: ResponsiveStyleValue<number> = { xs: 6, md: 10 };

/**
 * The gap between a section's heading block and its content: 24px on mobile,
 * 32px from `md` up.
 *
 * @remarks
 * Sits deliberately between {@link OUTER_SPACING} and {@link SECTION_SPACING}.
 * A heading needs more air beneath it than the items it introduces have between
 * them, or it reads as the first item in the list rather than as its title.
 */
export const HEADING_SPACING: ResponsiveStyleValue<number> = { xs: 3, md: 4 };

/** Maximum content width, keeping line lengths readable on wide screens. */
export const CONTENT_MAX_WIDTH = 1280;
