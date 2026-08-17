/**
 * The brand mark.
 *
 * @module components/layout/BrandLogo
 */
import Box from '@mui/material/Box';
import { useEffect, useRef, useState } from 'react';

import { RADIUS } from '@/theme/tokens';

/**
 * Path to the brand artwork.
 *
 * @remarks
 * Until this file exists the component falls back to the monogram below, so a
 * missing asset never shows a broken image.
 */
const LOGO_SRC = '/logo.png';

/**
 * The artwork's own background, sampled from its corners.
 *
 * @remarks
 * The file is opaque, not transparent, so the mark always arrives on a ground
 * of its own. Painting the same colour behind it means the tile is invisible
 * against the white header and reads as a deliberate badge on the navy footer,
 * rather than as a stray white rectangle either way.
 */
const LOGO_GROUND = '#FCFCFC';

/**
 * The window onto {@link LOGO_SRC} that shows the mark alone.
 *
 * @remarks
 * The supplied artwork is the *complete* lockup — the mandala with "Manisha
 * Readymades" and "Vizianagaram" set beneath it. That is the right file for the
 * places where the brand is the subject, but it is wrong everywhere this
 * component is used: beside the header's typographic wordmark it prints the
 * name twice, and at 30–36px the embedded text is an illegible smudge.
 *
 * Rather than depend on a second, hand-cropped file that may never arrive,
 * the mark is cropped out of the one asset that exists. Measured from the
 * 1254² source: the mandala spans x 119–1120, y 40–1034, and the script
 * wordmark's ascenders begin at y 1035 — so there is no slack at all beneath
 * the mark. The window is therefore the tightest square that still contains it
 * (x 118.5–1120.5, y 30–1032), which is `1254 / 1002 = 125.1%` of the box,
 * offset by the fractions below. The last two rows of the lowest petal's taper
 * fall outside it, which is invisible at every size drawn here and is what
 * keeps the ascenders out.
 *
 * Breathing room comes from {@link MARK_INSET} rather than from widening this
 * window: zooming out to make a margin drags the wordmark back into view.
 *
 * Replace with `100 / 0 / 0` if the artwork is ever swapped for a mark-only
 * crop.
 */
const MARK_CROP = { width: 125.1, left: -11.8, top: -3.0 } as const;

/**
 * Padding around the cropped mark, as a fraction of the rendered size.
 *
 * @remarks
 * The crop is edge-to-edge by necessity (see {@link MARK_CROP}), and a mark
 * touching the sides of its tile looks cramped. Insetting the window keeps the
 * proportion constant from the 30px admin mark to the 92px hero one.
 */
const MARK_INSET = 0.07;

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
  const imageRef = useRef<HTMLImageElement>(null);

  /*
   * Detects a missing file even when it failed before React was listening.
   *
   * The page is server-rendered, so the browser requests this image while
   * parsing the initial HTML — well before hydration attaches `onError`. A
   * 404 therefore fires its error event into a void, and the broken-image
   * icon stays on screen. Re-checking after mount catches exactly that case:
   * a request that has finished (`complete`) but produced no pixels
   * (`naturalWidth === 0`) is a failure, whenever it happened.
   */
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) setHasArtwork(false);
  }, []);

  if (hasArtwork) {
    return (
      <Box
        aria-hidden
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          padding: `${size * MARK_INSET}px`,
          borderRadius: `${size <= 48 ? RADIUS.sm : RADIUS.md}px`,
          backgroundColor: LOGO_GROUND,
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- A local static asset; next/image would add a loader for no benefit at this size. */}
          <img
            ref={imageRef}
            src={LOGO_SRC}
            alt=""
            onError={() => setHasArtwork(false)}
            style={{
              position: 'absolute',
              width: `${MARK_CROP.width}%`,
              left: `${MARK_CROP.left}%`,
              top: `${MARK_CROP.top}%`,
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>
      </Box>
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
