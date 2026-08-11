/**
 * Page and section shells that own the project's spacing contract.
 *
 * Pages compose these instead of writing their own padding, which is what keeps
 * the 24/16 desktop and 16/8 mobile rhythm identical everywhere.
 *
 * @module components/common/PageContainer
 */
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { CONTENT_MAX_WIDTH, INNER_SPACING, OUTER_SPACING, SECTION_SPACING } from '@/theme/spacing';

/** Props for {@link PageContainer}. */
interface PageContainerProps {
  children: ReactNode;
  /** Removes the vertical outer padding, for pages that open with a full-bleed hero. */
  disableTopPadding?: boolean;
}

/**
 * The outermost wrapper for page content: applies the outer gutter (16px
 * mobile, 24px desktop) horizontally and vertically, and caps the width.
 *
 * @param props - Page content and layout options.
 * @returns The container element.
 */
export function PageContainer({ children, disableTopPadding = false }: PageContainerProps): JSX.Element {
  return (
    <Container
      component="main"
      sx={{
        maxWidth: `${CONTENT_MAX_WIDTH}px !important`,
        pt: disableTopPadding ? 0 : OUTER_SPACING,
        pb: SECTION_SPACING,
      }}
    >
      {children}
    </Container>
  );
}

/** Props for {@link Section}. */
interface SectionProps {
  children: ReactNode;
  /** Heading rendered above the content. */
  title?: string;
  /** Supporting line beneath the heading. */
  subtitle?: string;
  /** Actions aligned to the end of the heading row, e.g. a "New" button. */
  action?: ReactNode;
}

/**
 * A titled block of page content, separated from its neighbours by the section
 * rhythm and spacing its own children by the inner step.
 *
 * @param props - Section heading, action and content.
 * @returns The section element.
 */
export function Section({ children, title, subtitle, action }: SectionProps): JSX.Element {
  return (
    <Box component="section" sx={{ mb: SECTION_SPACING }}>
      {(title || action) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={INNER_SPACING}
          sx={{ mb: OUTER_SPACING }}
        >
          <Box>
            {title && (
              <Typography variant="h3" component="h2">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
      )}
      {children}
    </Box>
  );
}
