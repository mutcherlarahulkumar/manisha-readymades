/**
 * The full brand lockup: mark and wordmark together.
 *
 * @module components/layout/BrandLockup
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';

import { BrandLogo } from '@/components/layout/BrandLogo';

/**
 * Path to the complete artwork — the mark together with the wordmark beneath it.
 *
 * @remarks
 * Distinct from the header's `logo.png`, which is the mark on its own. This is
 * the version to use where the brand is the subject rather than a label on
 * navigation: it is shown large, with nothing else nearby setting the name.
 *
 * Until the file exists the lockup is composed from the monogram and the brand
 * name in type, so the space is never empty and nothing renders broken.
 */
const LOCKUP_SRC = '/logo-full.png';

/** Props for {@link BrandLockup}. */
interface BrandLockupProps {
  /** Largest edge of the artwork, in pixels. */
  size?: number;
}

/**
 * The brand shown at size, for places where it is the content rather than a
 * navigational label.
 *
 * @param props - Rendered size.
 * @returns The lockup.
 */
export function BrandLockup({ size = 260 }: BrandLockupProps): JSX.Element {
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
      // eslint-disable-next-line @next/next/no-img-element -- A local static asset.
      <img
        ref={imageRef}
        src={LOCKUP_SRC}
        alt="Manisha Readymades"
        onError={() => setHasArtwork(false)}
        style={{
          width: '100%',
          maxWidth: size,
          height: 'auto',
          display: 'block',
          // Artwork on its own ground: contained, never cropped.
          objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <Stack alignItems="center" spacing={1.5}>
      <BrandLogo size={Math.round(size * 0.42)} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          component="p"
          sx={{
            color: 'primary.main',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
          }}
        >
          Manisha Readymades
        </Typography>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.18em' }}>
          Wholesale Garments
        </Typography>
      </Box>
    </Stack>
  );
}
