/**
 * Public product catalogue with URL-driven filtering and pagination.
 *
 * @module pages/products/index
 */
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import { EmptyState, LoadingState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { ProductGrid } from '@/components/product/ProductCard';
import {
  ProductFilters,
  SORT_OPTIONS,
  type ProductFilterValues,
} from '@/components/product/ProductFilters';
import { useRouteLoading } from '@/hooks/useRouteLoading';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listProducts } from '@/services/product.service';
import { listBrands, listCategories } from '@/services/taxonomy.service';
import { OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, stickyContentTop } from '@/theme/tokens';
import type { PaginationMeta } from '@/types/api';
import type { Banner, Brand, CategoryWithParent, ProductListItem } from '@/types/models';
import { productQuerySchema } from '@/validation/product.schema';

/** Props supplied by {@link getServerSideProps}. */
interface ProductsPageProps {
  products: ProductListItem[];
  meta: PaginationMeta;
  categories: CategoryWithParent[];
  brands: Brand[];
  banners: Banner[];
  filters: ProductFilterValues;
}

/** Filter state with every field cleared. */
const EMPTY_FILTERS: ProductFilterValues = {
  search: '',
  categories: [],
  brands: [],
  sizes: [],
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
};

/** A single active filter, rendered as a removable chip. */
interface ActiveFilter {
  /** Text shown on the chip. */
  label: string;
  /** Filter state with just this selection removed. */
  next: ProductFilterValues;
}

/**
 * The catalogue page.
 *
 * @param props - Server-rendered products, filter options and current filters.
 * @returns The products page.
 */
export default function ProductsPage({
  products,
  meta,
  categories,
  brands,
  banners,
  filters,
}: ProductsPageProps): JSX.Element {
  const router = useRouter();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const topBanners = banners.filter((b) => b.position === 'top');
  // Filtering, sorting and paging are all server round-trips on this page.
  const isFiltering = useRouteLoading();

  /**
   * Writes filter state back to the URL, which re-runs the server query.
   * Changing a filter always resets to page 1, since the old page number is
   * meaningless against a different result set.
   */
  const applyFilters = useCallback(
    (next: ProductFilterValues, page = 1): void => {
      const query: Record<string, string> = {};
      if (next.search) query.search = next.search;
      if (next.categories.length > 0) query.categories = next.categories.join(',');
      if (next.brands.length > 0) query.brands = next.brands.join(',');
      if (next.sizes.length > 0) query.sizes = next.sizes.join(',');
      if (next.minPrice) query.minPrice = next.minPrice;
      if (next.maxPrice) query.maxPrice = next.maxPrice;
      if (next.sort !== 'newest') query.sort = next.sort;
      if (page > 1) query.page = String(page);

      void router.push({ pathname: '/products', query }, undefined, { scroll: true });
    },
    [router],
  );

  const handleReset = useCallback(() => applyFilters(EMPTY_FILTERS), [applyFilters]);

  const filterPanel = useMemo(
    () => (
      <ProductFilters
        values={filters}
        categories={categories}
        brands={brands}
        onChange={(next) => applyFilters(next)}
        onReset={handleReset}
      />
    ),
    [filters, categories, brands, applyFilters, handleReset],
  );

  /**
   * The currently applied filters, as chips that each remove one selection.
   *
   * @remarks
   * Without this, a visitor arriving on a filtered link — from a category tile
   * on the home page, say — sees a short result list with no visible
   * explanation, because on mobile the filter panel is behind a drawer. Sort is
   * deliberately excluded: it orders the results rather than narrowing them, so
   * it is not something to "remove".
   */
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];

    if (filters.search) {
      chips.push({ label: `“${filters.search}”`, next: { ...filters, search: '' } });
    }
    for (const slug of filters.categories) {
      const match = categories.find((category) => category.slug === slug);
      chips.push({
        label: match?.name ?? slug,
        next: { ...filters, categories: filters.categories.filter((item) => item !== slug) },
      });
    }
    for (const slug of filters.brands) {
      const match = brands.find((brand) => brand.slug === slug);
      chips.push({
        label: match?.name ?? slug,
        next: { ...filters, brands: filters.brands.filter((item) => item !== slug) },
      });
    }
    for (const size of filters.sizes) {
      chips.push({
        label: `Size ${size}`,
        next: { ...filters, sizes: filters.sizes.filter((item) => item !== size) },
      });
    }
    if (filters.minPrice) {
      chips.push({ label: `Min ₹${filters.minPrice}`, next: { ...filters, minPrice: '' } });
    }
    if (filters.maxPrice) {
      chips.push({ label: `Max ₹${filters.maxPrice}`, next: { ...filters, maxPrice: '' } });
    }

    return chips;
  }, [filters, categories, brands]);

  /**
   * The sort control repeated in the results toolbar.
   *
   * @remarks
   * Sort also lives in the filter panel and writes the same state. It is
   * surfaced here because on mobile the panel is inside a drawer, and burying
   * "price: low to high" two taps deep in a wholesale catalogue is the wrong
   * trade. Both controls read from the same URL state, so they can never
   * disagree.
   */
  const sortControl = (
    <TextField
      select
      size="small"
      label="Sort by"
      value={filters.sort}
      onChange={(event) => applyFilters({ ...filters, sort: event.target.value })}
      sx={{ minWidth: 190, maxWidth: 220 }}
    >
      {SORT_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <StoreLayout title="Products" topBanners={topBanners} categories={categories}>
      <PageContainer>
        <Section
          title="All Products"
          subtitle={`${meta.total} product${meta.total === 1 ? '' : 's'} available`}
        >
          <Box
            sx={{
              display: 'grid',
              gap: OUTER_SPACING,
              gridTemplateColumns: { xs: '1fr', md: '270px minmax(0, 1fr)' },
              alignItems: 'start',
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'sticky',
                // Derived from the header's own tokens rather than guessed. The
                // announcement strip is not part of this: it scrolls away with
                // the page instead of sticking.
                top: stickyContentTop(categories.length > 0),
                maxHeight: '80vh',
                overflowY: 'auto',
                // A long category tree must scroll inside the panel, never push
                // the page sideways.
                overscrollBehavior: 'contain',
              }}
            >
              {filterPanel}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              {/* Results toolbar: what is being shown, and the two controls
                  that change it. */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                  {meta.total === 0
                    ? 'No products'
                    : `Showing ${products.length} of ${meta.total}`}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <Button
                    startIcon={<FilterListIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => setIsFilterDrawerOpen(true)}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                  >
                    Filters
                    {activeFilters.length > 0 && ` (${activeFilters.length})`}
                  </Button>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{sortControl}</Box>
                </Stack>
              </Stack>

              {/* On the narrowest screens the sort control gets its own row
                  rather than being squeezed against the filter button. */}
              <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>{sortControl}</Box>

              {activeFilters.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: 'wrap', mb: 2, alignItems: 'center' }}
                >
                  {activeFilters.map((filter) => (
                    <Chip
                      key={filter.label}
                      label={filter.label}
                      size="small"
                      variant="outlined"
                      onDelete={() => applyFilters(filter.next)}
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  ))}
                  <Button size="small" onClick={handleReset} sx={{ minHeight: 28, px: 1 }}>
                    Clear all
                  </Button>
                </Stack>
              )}

              {/* While a filter change is in flight the old results are stale
                  and about to be replaced, so they give way to placeholders of
                  the same shape rather than sitting there looking current. */}
              {isFiltering ? (
                <LoadingState variant="skeleton" skeletonCount={products.length || 8} />
              ) : products.length === 0 ? (
                <EmptyState
                  title="No products match your filters"
                  description="Try removing a filter or widening the price range."
                  action={
                    <Button variant="contained" onClick={handleReset}>
                      Clear all filters
                    </Button>
                  }
                />
              ) : (
                <>
                  <ProductGrid products={products} />

                  {meta.totalPages > 1 && (
                    <Stack alignItems="center" sx={{ mt: { xs: 4, md: 6 } }}>
                      <Pagination
                        count={meta.totalPages}
                        page={meta.page}
                        color="primary"
                        shape="rounded"
                        siblingCount={0}
                        boundaryCount={1}
                        onChange={(_event, page) => applyFilters(filters, page)}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
                        Page {meta.page} of {meta.totalPages}
                      </Typography>
                    </Stack>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Section>
      </PageContainer>

      <Drawer
        anchor="left"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '88vw', sm: 340 }, maxWidth: 380 } }}
      >
        {/* The drawer has its own header so the close control is always in the
            same place, and the panel below it scrolls independently. */}
        <Stack sx={{ height: '100%' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, flexShrink: 0 }}
          >
            <Typography variant="h6" component="h2">
              Filters
            </Typography>
            <IconButton onClick={() => setIsFilterDrawerOpen(false)} aria-label="Close filters" edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>{filterPanel}</Box>

          <Box sx={{ p: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={() => setIsFilterDrawerOpen(false)}
              sx={{ borderRadius: `${RADIUS.sm}px` }}
            >
              Show {meta.total} result{meta.total === 1 ? '' : 's'}
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </StoreLayout>
  );
}

/**
 * Runs the filtered product query on the server so results are shareable and
 * indexable.
 *
 * @param context - The Next.js context, carrying the query string.
 * @returns Page props for {@link ProductsPage}.
 */
export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async (context) => {
  await connectToDatabase();

  // An unparseable query string is a bad link, not an error page: fall back to
  // the default listing rather than throwing.
  let query;
  try {
    query = await productQuerySchema.validate(context.query, { stripUnknown: true });
  } catch {
    query = await productQuerySchema.validate({});
  }

  const [result, categories, brands, banners] = await Promise.all([
    listProducts(query),
    listCategories({ activeOnly: true }),
    listBrands({ activeOnly: true }),
    listBanners({ visibleOnly: true }),
  ]);

  return {
    props: {
      products: result.items,
      meta: result.meta,
      categories,
      brands,
      banners,
      filters: {
        search: query.search,
        categories: query.categories,
        brands: query.brands,
        sizes: query.sizes,
        minPrice: query.minPrice === null ? '' : String(query.minPrice),
        maxPrice: query.maxPrice === null ? '' : String(query.maxPrice),
        sort: query.sort,
      },
    },
  };
};
