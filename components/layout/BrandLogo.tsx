/**
 * The brand mark.
 *
 * @module components/layout/BrandLogo
 */
import Box from '@mui/material/Box';

/** Props for {@link BrandLogo}. */
interface BrandLogoProps {
  /** Rendered size in pixels. The mark is square. */
  size?: number;
  /** Renders the mark for a dark surface, where the tile would disappear. */
  inverse?: boolean;
}

/**
 * The Manisha Readymades monogram.
 *
 * @param props - Size and surface treatment.
 * @returns The mark as inline SVG.
 *
 * @remarks
 * Drawn as inline SVG rather than shipped as an image file for three reasons:
 * it stays crisp at every density, it costs no network request on a page where
 * it is the first thing rendered, and it can take its colours from the theme
 * instead of being baked in.
 *
 * The letterform is a single "M" built from two strokes. The left stroke is the
 * neutral one and the right is carried in the accent amber — the same amber
 * used for discounts and primary calls to action — so the mark is built from
 * the palette the rest of the interface already uses rather than introducing a
 * third brand colour.
 *
 * `aria-hidden` throughout: the mark is always accompanied by the brand name,
 * either visibly or as the link's accessible label, so announcing it again
 * would just be duplication for a screen-reader user.
 */
export function BrandLogo({ size = 36, inverse = false }: BrandLogoProps): JSX.Element {
  return (
    <Box
      aria-hidden
      component="svg"
      viewBox="0 0 40 40"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
      }}
    >
      <rect
        width="40"
        height="40"
        rx="11"
        fill={inverse ? 'rgba(255,255,255,0.10)' : '#1F3A8A'}
      />
      {/* Left half of the M. */}
      <path
        d="M11 29V13.5L20 22.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right half, in the accent. */}
      <path
        d="M20 22.5L29 13.5V29"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
