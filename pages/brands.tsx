/**
 * Public brand directory, loaded a page at a time.
 *
 * The first page is server-rendered so the list is indexable and complete on
 * first paint; further pages arrive as the visitor scrolls.
 *
 * @module pages/brands
 */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';

import { AppendingSkeletons } from '@/components/common/Skeletons';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listBrandsPaginated, listCategories } from '@/services/taxonomy.service';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
import type { PaginationMeta } from '@/types/api';
import type { Banner, Brand, CategoryWithParent } from '@/types/models';

/** Brands fetched per page. */
const PAGE_SIZE = 12;

/** Props supplied by {@link getServerSideProps}. */
interface BrandsPageProps {
  brands: Brand[];
  meta: PaginationMeta;
  categories: CategoryWithParent[];
  banners: Banner[];
}

/**
 * The brand directory.
 *
 * @param props - The first page of brands plus navigation data.
 * @returns The page element.
 */
export default function BrandsPage({
  brands,
  meta: initialMeta,
  categories,
  banners,
}: BrandsPageProps): JSX.Element {
  const topBanners = banners.filter((banner) => banner.position === 'top');
  const { items, meta, isLoadingMore, error, hasMore, loadMore, sentinelRef } =
    useInfiniteList<Brand>('/api/brands', brands, initialMeta);

  return (
    <StoreLayout
      title="Brands"
      description="Every brand stocked by Manisha Readymades, available at wholesale prices."
      topBanners={topBanners}
      categories={categories}
    >
      <PageContainer>
        <Section
          title="All Brands"
          subtitle={`${meta.total} brand${meta.total === 1 ? '' : 's'} stocked.`}
        >
          {meta.total === 0 ? (
            <EmptyState
              title="No brands yet"
              description="Brands will appear here once they have been added to the catalogue."
              action={
                <Button component={NextLink} href="/products" variant="contained">
                  Browse all products
                </Button>
              }
            />
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gap: OUTER_SPACING,
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                }}
              >
                {items.map((brand) => (
                  <BrandCard key={brand._id} brand={brand} />
                ))}

                {/* Placeholders appended in the grid itself, so the next page
                    lands in space already reserved for it rather than pushing
                    the page around as it arrives. */}
                {isLoadingMore && <AppendingSkeletons count={4} />}
              </Box>

              {/*
                Infinite scroll with a real button behind it. The sentinel loads
                the next page automatically, but keyboard users, screen-reader
                users and anyone whose scroll never reaches the trigger still
                need an explicit control — and it is the only way to recover
                from a failed page.
              */}
              {hasMore && (
                <Stack alignItems="center" sx={{ mt: 4 }}>
                  {/*
                    The scroll sentinel. Its height is written as an explicit
                    pixel string: MUI's `sx` reads a bare number of 1 or less as
                    a *percentage*, which resolved to a zero-height box here —
                    and IntersectionObserver never reports a target with no
                    area, so the automatic loading silently did nothing while
                    the button below still worked.
                  */}
                  <Box ref={sentinelRef} aria-hidden sx={{ height: '8px', width: '100%' }} />
                  {error ? (
                    <ErrorState
                      message={
                        error instanceof Error ? error.message : 'Could not load more brands.'
                      }
                      onRetry={loadMore}
                    />
                  ) : (
                    <Button variant="outlined" onClick={loadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? 'Loading…' : 'Load more brands'}
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
                    Showing {items.length} of {meta.total}
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Section>
      </PageContainer>
    </StoreLayout>
  );
}

/** Props for {@link BrandCard}. */
interface BrandCardProps {
  brand: Brand;
}

/**
 * A single brand tile linking into the filtered catalogue.
 *
 * @param props - The brand to render.
 * @returns The card element.
 */
function BrandCard({ brand }: BrandCardProps): JSX.Element {
  return (
    <Box
      component={NextLink}
      href={`/products?brands=${brand.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        borderRadius: `${RADIUS.md}px`,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms, border-color 260ms',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: SHADOW.md,
          borderColor: SURFACE.borderStrong,
        },
        '&:hover .brand-card__arrow': { transform: 'translateX(3px)' },
        '@media (hover: none)': { '&:hover': { transform: 'none', boxShadow: 'none' } },
        '@media (prefers-reduced-motion: reduce)': {
          '&:hover': { transform: 'none' },
          '&:hover .brand-card__arrow': { transform: 'none' },
        },
      }}
    >
      {/*
        A brand logo is artwork on its own ground, not a photograph: it is
        contained with padding rather than cropped to fill, so nothing is cut
        off. Where no logo exists the initial stands in, which keeps the grid
        even instead of leaving a hole.
      */}
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          aspectRatio: '3 / 2',
          p: INNER_SPACING,
          bgcolor: SURFACE.subtle,
        }}
      >
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
          <img
            src={brand.logo.url}
            alt={brand.logo.alt ?? brand.name}
            loading="lazy"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </Box>
        )}
      </Box>

      <Box sx={{ p: INNER_SPACING, flexGrow: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography variant="subtitle1" component="h3" sx={{ minWidth: 0 }} noWrap>
            {brand.name}
          </Typography>
          <ArrowForwardIcon
            className="brand-card__arrow"
            sx={{ fontSize: 15, color: 'secondary.main', flexShrink: 0, transition: 'transform 220ms' }}
          />
        </Stack>
      </Box>
    </Box>
  );
}

/**
 * Loads the first page of brands, plus navigation data.
 *
 * @returns Page props for {@link BrandsPage}.
 */
export const getServerSideProps: GetServerSideProps<BrandsPageProps> = async () => {
  await connectToDatabase();

  const [brandPage, categories, banners] = await Promise.all([
    listBrandsPaginated({ activeOnly: true, page: 1, limit: PAGE_SIZE }),
    listCategories({ activeOnly: true }),
    listBanners({ visibleOnly: true }),
  ]);

  return {
    props: { brands: brandPage.items, meta: brandPage.meta, categories, banners },
  };
};
