/**
 * Public product catalogue with URL-driven filtering and pagination.
 *
 * @module pages/products/index
 */
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductFilters, type ProductFilterValues } from '@/components/product/ProductFilters';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listProducts } from '@/services/product.service';
import { listBrands, listCategories } from '@/services/taxonomy.service';
import { OUTER_SPACING } from '@/theme/spacing';
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

  return (
    <StoreLayout title="Products" topBanners={banners.filter((b) => b.position === 'top')}>
      <PageContainer>
        <Section
          title="All Products"
          subtitle={`${meta.total} product${meta.total === 1 ? '' : 's'} available`}
          action={
            <Button
              startIcon={<FilterListIcon />}
              variant="outlined"
              onClick={() => setIsFilterDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              Filters
            </Button>
          }
        >
          <Box
            sx={{
              display: 'grid',
              gap: OUTER_SPACING,
              gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 88 }}>
              {filterPanel}
            </Box>

            <Box>
              {products.length === 0 ? (
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
                    <Stack alignItems="center" sx={{ mt: OUTER_SPACING }}>
                      <Pagination
                        count={meta.totalPages}
                        page={meta.page}
                        color="primary"
                        onChange={(_event, page) => applyFilters(filters, page)}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
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
        PaperProps={{ sx: { width: 300, p: 2 } }}
      >
        {filterPanel}
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
