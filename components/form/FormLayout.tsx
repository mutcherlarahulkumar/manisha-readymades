/**
 * Structural pieces of the traditional form layout: a bordered panel with a
 * titled header, a labelled row per field, and a sticky action bar.
 *
 * Field spacing comes from the inner token, panel spacing from the outer one,
 * so forms match the rest of the application without ad-hoc padding.
 *
 * @module components/form/FormLayout
 */
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { CONTENT_MAX_WIDTH, INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';

/** Props for {@link FormPanel}. */
interface FormPanelProps {
  /** Panel heading, e.g. "Product details". */
  title: string;
  /** Explanatory line beneath the heading. */
  description?: string;
  children: ReactNode;
}

/**
 * A titled group of related fields.
 *
 * @param props - Heading, description and fields.
 * @returns The panel element.
 */
export function FormPanel({ title, description, children }: FormPanelProps): JSX.Element {
  return (
    <Paper variant="outlined" sx={{ mb: OUTER_SPACING, borderRadius: `${RADIUS.md}px` }}>
      {/* The header sits on a tinted band so a long form reads as a stack of
          labelled groups when scrolled past quickly. */}
      <Box sx={{ p: 2, bgcolor: SURFACE.subtle, borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0` }}>
        <Typography variant="h5" component="h3">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Divider />
      <Stack spacing={2} sx={{ p: { xs: 2, md: 2.5 } }}>
        {children}
      </Stack>
    </Paper>
  );
}

/** Props for {@link FormRow}. */
interface FormRowProps {
  children: ReactNode;
  /** Fields per row on desktop; always one on mobile. */
  columns?: 1 | 2 | 3;
}

/**
 * Lays fields out side by side on wider screens and stacked on mobile.
 *
 * @param props - The fields and the desktop column count.
 * @returns The row element.
 */
export function FormRow({ children, columns = 2 }: FormRowProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: INNER_SPACING,
        gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, 1fr)` },
      }}
    >
      {children}
    </Box>
  );
}

/** Props for {@link FormActions}. */
interface FormActionsProps {
  children: ReactNode;
}

/**
 * The form's action bar, pinned to the bottom of the viewport so Save stays
 * reachable on long forms.
 *
 * @param props - The action buttons.
 * @returns The action bar element.
 */
export function FormActions({ children }: FormActionsProps): JSX.Element {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        p: 2,
        borderRadius: 0,
        // Full-bleed against the page gutters, so the bar reads as chrome
        // pinned to the viewport rather than as another panel in the form.
        mx: { xs: -2, md: -3 },
        px: { xs: 2, md: 3 },
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        boxShadow: SHADOW.sm,
      }}
    >
      <Stack
        direction="row"
        spacing={INNER_SPACING}
        justifyContent="flex-end"
        sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto', width: '100%' }}
      >
        {children}
      </Stack>
    </Paper>
  );
}
