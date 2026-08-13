/**
 * Content-shaped loading placeholders.
 *
 * Every skeleton here mirrors the real component's proportions — same aspect
 * ratio, same padding, same number of text lines. A placeholder whose shape
 * differs from the content that replaces it causes a visible reflow on load,
 * which is worse than showing nothing at all.
 *
 * @module components/common/Skeletons
 */
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps, Theme } from '@mui/material/styles';

import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/tokens';

/** Grid template shared by the tile grids, matching the real layouts. */
const TILE_GRID_SX: SxProps<Theme> = {
  display: 'grid',
  gap: { xs: 1.5, md: 3 },
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
    md: 'repeat(4, minmax(0, 1fr))',
  },
};

/** A single card outline used by both tile skeletons. */
function SkeletonCard({
  aspectRatio,
  lines = 2,
}: {
  aspectRatio: string;
  lines?: number;
}): JSX.Element {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${RADIUS.md}px`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Skeleton variant="rectangular" sx={{ aspectRatio, borderRadius: 0 }} />
      <Box sx={{ p: INNER_SPACING }}>
        <Skeleton width="70%" height={16} />
        {lines > 1 && <Skeleton width="45%" height={14} sx={{ mt: 0.5 }} />}
      </Box>
    </Box>
  );
}

/** Props for the grid skeletons. */
interface GridSkeletonProps {
  /** How many placeholder cards to draw. */
  count?: number;
}

/**
 * Placeholder grid matching the category tiles.
 *
 * @param props - Number of placeholders.
 * @returns The skeleton grid.
 */
export function CategoryGridSkeleton({ count = 8 }: GridSkeletonProps): JSX.Element {
  return (
    <Box sx={TILE_GRID_SX} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} aspectRatio="4 / 3" />
      ))}
    </Box>
  );
}

/**
 * Placeholder grid matching the brand cards.
 *
 * @param props - Number of placeholders.
 * @returns The skeleton grid.
 */
export function BrandGridSkeleton({ count = 8 }: GridSkeletonProps): JSX.Element {
  return (
    <Box sx={TILE_GRID_SX} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} aspectRatio="3 / 2" lines={1} />
      ))}
    </Box>
  );
}

/**
 * A bare row of placeholder cards, for appending beneath an already-loaded
 * grid while the next page is fetched.
 *
 * @param props - Number of placeholders.
 * @returns The skeleton cards, without their own grid container.
 */
export function AppendingSkeletons({ count = 4 }: GridSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`appending-${index}`} aspectRatio="3 / 2" lines={1} />
      ))}
    </>
  );
}
