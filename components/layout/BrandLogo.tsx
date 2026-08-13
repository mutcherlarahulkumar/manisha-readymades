/**
 * The brand mark.
 *
 * @module components/layout/BrandLogo
 */
import Box from '@mui/material/Box';
import { useState } from 'react';

/**
 * Path to the brand artwork.
 *
 * @remarks
 * Drop the real logo at `public/logo.png` (or change this to `.svg`, which is
 * preferable — it stays sharp at every size and is a fraction of the weight).
 * A **mark-only** crop works best here: the header already sets the brand name
 * in type beside it, so a file that includes the wordmark would print the name
 * twice.
 *
 * Until that file exists the component falls back to the monogram below, so a
 * missing asset never shows a broken image.
 */
const LOGO_SRC = '/logo.png';

/** Props for {@link BrandLogo}. */
interface BrandLogoProps {
  /** Rendered size in pixels. The mark is square. */
  size?: number;
  /** Renders the mark for a dark surface, where the tile would disappear. */
  inverse?: boolean;
}

/**
 * The Manisha Readymades mark.
 *
 * @param props - Size and surface treatment.
 * @returns The logo image, or the fallback monogram.
 *
 * @remarks
 * The real artwork is preferred and the monogram is only a stand-in. The swap
 * is driven by the image's own `error` event rather than by a build-time check,
 * so adding the file is the entire deployment step — no code change, no
 * configuration.
 *
 * `aria-hidden` throughout: the mark is always accompanied by the brand name,
 * either visibly or as the link's accessible label, so announcing it again
 * would just be duplication for a screen-reader user.
 */
export function BrandLogo({ size = 36, inverse = false }: BrandLogoProps): JSX.Element {
  const [hasArtwork, setHasArtwork] = useState(true);

  if (hasArtwork) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- A local static asset; next/image would add a loader for no benefit at this size.
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden
        width={size}
        height={size}
        onError={() => setHasArtwork(false)}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'block',
          // Contained, never cropped: a logo is artwork on its own ground, and
          // `cover` would clip the outer petals of a mark like this one.
          objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <Box
      aria-hidden
      component="svg"
      viewBox="0 0 40 40"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
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
