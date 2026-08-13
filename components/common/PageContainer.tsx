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

import { Reveal } from '@/components/motion/Reveal';
import {
  CONTENT_MAX_WIDTH,
  HEADING_SPACING,
  INNER_SPACING,
  OUTER_SPACING,
  SECTION_SPACING,
} from '@/theme/spacing';

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
        // The top gap is smaller than the gap between sections: content
        // following a header or a hero is already visually separated by the
        // change of surface, so it does not need the full section rhythm as
        // well.
        pt: disableTopPadding ? 0 : { xs: 3, md: 5 },
        pb: SECTION_SPACING,
      }}
    >
      {children}
    </Container>
  );
}

/**
 * How much room a section gives itself.
 *
 * `page` is the storefront rhythm: large gaps between sections and a display-
 * weight heading, so a marketing page reads as a sequence of distinct ideas.
 * `compact` is the dashboard rhythm, where an admin is scanning many blocks at
 * once and generous whitespace would mean more scrolling for less information.
 */
export type SectionDensity = 'page' | 'compact';

/** Props for {@link Section}. */
interface SectionProps {
  children: ReactNode;
  /** Heading rendered above the content. */
  title?: string;
  /** Supporting line beneath the heading. */
  subtitle?: string;
  /** Actions aligned to the end of the heading row, e.g. a "New" button. */
  action?: ReactNode;
  /** Spacing and heading scale. Defaults to the storefront rhythm. */
  density?: SectionDensity;
}

/**
 * A titled block of page content, separated from its neighbours by the section
 * rhythm and spacing its own children by the inner step.
 *
 * @param props - Section heading, action, density and content.
 * @returns The section element.
 *
 * @remarks
 * The heading block animates in as it enters the viewport; the content below it
 * does not, because most callers pass a grid that runs its own stagger. Two
 * competing entrance animations on the same block read as a stutter.
 */
export function Section({
  children,
  title,
  subtitle,
  action,
  density = 'page',
}: SectionProps): JSX.Element {
  const isPage = density === 'page';

  return (
    <Box
      component="section"
      sx={{ mb: isPage ? SECTION_SPACING : OUTER_SPACING, '&:last-child': { mb: 0 } }}
    >
      {(title || action) && (
        <Reveal>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            spacing={INNER_SPACING}
            sx={{ mb: isPage ? HEADING_SPACING : OUTER_SPACING }}
          >
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant={isPage ? 'h2' : 'h4'} component="h2">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: isPage ? 1 : 0.5, maxWidth: '60ch' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
          </Stack>
        </Reveal>
      )}
      {children}
    </Box>
  );
}
