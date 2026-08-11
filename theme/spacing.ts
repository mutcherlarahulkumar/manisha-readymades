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
 * Vertical rhythm between page sections — double the outer spacing, so sections
 * read as separated without introducing a fifth magic number.
 */
export const SECTION_SPACING: ResponsiveStyleValue<number> = { xs: 4, md: 6 };

/** Maximum content width, keeping line lengths readable on wide screens. */
export const CONTENT_MAX_WIDTH = 1280;
