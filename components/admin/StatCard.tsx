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
    <Stack direction="row" spacing={INNER_SPACING} alignItems="center">
      {icon && (
        <Box
          sx={{
            display: 'flex',
            p: 1,
            borderRadius: 1,
            bgcolor: `${color}.main`,
            color: `${color}.contrastText`,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
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
        p: INNER_SPACING,
        height: '100%',
        borderLeft: '4px solid',
        borderLeftColor: `${color}.main`,
        ...(href && { textDecoration: 'none', '&:hover': { bgcolor: 'action.hover' } }),
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
