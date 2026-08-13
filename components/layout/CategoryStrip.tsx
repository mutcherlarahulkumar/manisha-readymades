/**
 * The category navigation strip that sits directly beneath the header.
 *
 * @module components/layout/CategoryStrip
 */
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { RADIUS, SHELL_MAX_WIDTH, SURFACE } from '@/theme/tokens';
import type { CategoryWithParent } from '@/types/models';

/** Props for {@link CategoryStrip}. */
interface CategoryStripProps {
  /** Every category; only top-level entries are shown. */
  categories: readonly CategoryWithParent[];
}

/**
 * A horizontal row of top-level category links.
 *
 * @param props - The categories to list.
 * @returns The strip, or `null` when there are no categories to show.
 *
 * @remarks
 * The pattern every large marketplace uses: the catalogue's top level is
 * permanent navigation rather than a destination you have to scroll the home
 * page to reach. Each entry links to the catalogue filtered by that category —
 * the same `/products?categories=` URL the filter sidebar writes — so this adds
 * reach, not a second filtering mechanism.
 *
 * On narrow screens the row scrolls horizontally instead of wrapping. Wrapping
 * would make the header's height depend on how many categories the admin has
 * created, which would push the page content down by an unpredictable amount.
 */
export function CategoryStrip({ categories }: CategoryStripProps): JSX.Element | null {
  const router = useRouter();
  const topLevel = categories.filter((category) => category.parent === null);

  if (topLevel.length === 0) return null;

  const activeSlugs =
    typeof router.query.categories === 'string' ? router.query.categories.split(',') : [];
  const isAllActive = router.pathname === '/products' && activeSlugs.length === 0;

  return (
    <Box
      component="nav"
      aria-label="Product categories"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <Container sx={{ maxWidth: `${SHELL_MAX_WIDTH}px !important` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflowX: 'auto',
            // The row is a scroll container on touch, but it should never look
            // like one: the scrollbar is suppressed and the overflow is
            // discovered by swiping, as on every marketplace.
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            // Cancels the container gutter so the first item aligns with the
            // logo above it, while still letting the row scroll edge to edge.
            mx: { xs: -1, md: -1.5 },
            px: { xs: 1, md: 1.5 },
            py: 0.75,
          }}
        >
          <CategoryLink href="/products" label="All Products" isActive={isAllActive} />
          {topLevel.map((category) => (
            <CategoryLink
              key={category._id}
              href={`/products?categories=${category.slug}`}
              label={category.name}
              isActive={activeSlugs.includes(category.slug)}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
}

/** Props for {@link CategoryLink}. */
interface CategoryLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

/**
 * A single entry in the strip.
 *
 * @param props - Target, label and active state.
 * @returns The link element.
 */
function CategoryLink({ href, label, isActive }: CategoryLinkProps): JSX.Element {
  return (
    <Box
      component={NextLink}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        flexShrink: 0,
        px: 1.5,
        py: 0.75,
        borderRadius: `${RADIUS.sm}px`,
        fontSize: '0.8125rem',
        fontWeight: isActive ? 700 : 500,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? SURFACE.subtle : 'transparent',
        transition: 'background-color 160ms, color 160ms',
        '&:hover': { bgcolor: SURFACE.subtle, color: 'primary.main' },
      }}
    >
      {label}
    </Box>
  );
}
