/**
 * Dashboard metric tiles.
 *
 * @module components/admin/StatCard
 */
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW } from '@/theme/tokens';

/** Props for {@link StatCard}. */
interface StatCardProps {
  label: string;
  value: number | string;
  /** Secondary line, e.g. "in the last 30 days". */
  hint?: string;
  icon?: ReactNode;
  /** Theme palette key used for the accent bar. */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Makes the whole tile a link into the relevant list. */
  href?: string;
}

/**
 * A single metric tile.
 *
 * @param props - Metric label, value and presentation.
 * @returns The tile element.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  color = 'primary',
  href,
}: StatCardProps): JSX.Element {
  const content = (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {icon && (
          // The icon is a tinted glyph rather than a saturated block: at six
          // tiles across a dashboard, six solid colour swatches compete with
          // the numbers they are supposed to be labelling.
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: `${RADIUS.sm}px`,
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              opacity: 0.92,
              '& .MuiSvgIcon-root': { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>

      <Box sx={{ minWidth: 0, mt: 'auto' }}>
        <Typography
          sx={{
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.5rem', md: '1.75rem' },
          }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        p: INNER_SPACING,
        height: '100%',
        borderRadius: `${RADIUS.md}px`,
        // A colour accent along the top edge keeps the category cue without
        // the heavy left rule crowding the label.
        borderTop: '3px solid',
        borderTopColor: `${color}.main`,
        transition: 'box-shadow 200ms, border-color 200ms, transform 200ms',
        ...(href && {
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': { boxShadow: SHADOW.sm, transform: 'translateY(-2px)' },
          '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        }),
      }}
      {...(href ? { component: NextLink, href } : {})}
    >
      {content}
    </Paper>
  );
}

/** Props for {@link StatGrid}. */
interface StatGridProps {
  children: ReactNode;
  /** Tiles per row on desktop. */
  columns?: 3 | 4 | 6;
}

/**
 * Responsive grid of metric tiles.
 *
 * @param props - The tiles and the desktop column count.
 * @returns The grid element.
 */
export function StatGrid({ children, columns = 4 }: StatGridProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: OUTER_SPACING,
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: `repeat(${columns}, 1fr)`,
        },
      }}
    >
      {children}
    </Box>
  );
}
