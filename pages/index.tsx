/**
 * Storefront home page.
 *
 * Server-rendered so the catalogue is indexable and the first paint already
 * contains products. Data is read through the service layer on the server —
 * the browser never touches MongoDB.
 *
 * @module pages/index
 */
import StarIcon from '@mui/icons-material/Star';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useState } from 'react';

import { EmptyState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { ProductGrid } from '@/components/product/ProductCard';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listProducts } from '@/services/product.service';
import { listCategories } from '@/services/taxonomy.service';
import { INNER_SPACING, OUTER_SPACING, SECTION_SPACING } from '@/theme/spacing';
import type { Banner, CategoryWithParent, ProductListItem } from '@/types/models';
import { QuoteRequestDialog } from '@/components/quote/QuoteRequestDialog';
import { productQuerySchema } from '@/validation/product.schema';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/** Selling points shown in the "Why choose us" section. */
const HIGHLIGHTS = [
  { title: 'Since 2020', detail: 'Five years supplying retailers across the region.' },
  { title: 'Best quality', detail: 'Fabric checked before every dispatch.' },
  { title: 'Wholesale prices', detail: 'Rates that leave room for your margin.' },
  { title: 'Fast WhatsApp support', detail: 'Same-day replies on orders and stock.' },
  { title: 'Bulk orders', detail: 'Large quantities handled end to end.' },
  { title: 'Trusted by retailers', detail: 'Repeat buyers from shops and boutiques.' },
] as const;

/** Custom printing services offered. */
const PRINTING_SERVICES = [
  'School Uniforms',
  'Company T-Shirts',
  'Event T-Shirts',
  'Political Campaigns',
  'Promotional Clothing',
] as const;

/** Props supplied by {@link getServerSideProps}. */
interface HomePageProps {
  banners: Banner[];
  categories: CategoryWithParent[];
  featured: ProductListItem[];
}

/**
 * The storefront landing page.
 *
 * @param props - Server-rendered banners, categories and featured products.
 * @returns The home page.
 */
export default function HomePage({ banners, categories, featured }: HomePageProps): JSX.Element {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const topBanners = banners.filter((banner) => banner.position === 'top');
  const heroBanner = banners.find((banner) => banner.position === 'hero');
  const topLevelCategories = categories.filter((category) => category.parent === null);

  return (
    <StoreLayout topBanners={topBanners}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: SECTION_SPACING,
          backgroundImage: heroBanner ? `url(${heroBanner.image.url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {heroBanner && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(18,36,92,0.72)' }} />
        )}
        <Container sx={{ position: 'relative' }}>
          <Stack spacing={INNER_SPACING} alignItems="center" textAlign="center">
            <Typography variant="h1" component="h1">
              {heroBanner?.title ?? 'Wholesale Garment Supplier'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 640 }}>
              {heroBanner?.subtitle ?? 'Premium clothing at wholesale prices.'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={INNER_SPACING} sx={{ pt: 1 }}>
              <Button component={NextLink} href="/products" variant="contained" color="secondary" size="large">
                Browse Products
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<WhatsAppIcon />}
                href={buildGeneralEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Us
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <PageContainer>
        <Section title="Categories" subtitle="Shop by what your customers ask for most.">
          {topLevelCategories.length === 0 ? (
            <EmptyState
              title="Categories are being set up"
              description="Product categories will appear here shortly."
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: OUTER_SPACING,
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {topLevelCategories.map((category) => (
                <Card key={category._id}>
                  <CardActionArea component={NextLink} href={`/products?categories=${category.slug}`}>
                    {category.image && (
                      <Box sx={{ aspectRatio: '16 / 9', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                        <img
                          src={category.image.url}
                          alt={category.image.alt ?? category.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="h6">{category.name}</Typography>
                      {category.description && (
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Section>

        <Section
          title="Featured Products"
          subtitle="Hand-picked stock, ready to ship."
          action={
            <Button component={NextLink} href="/products" variant="outlined">
              View All Products
            </Button>
          }
        >
          {featured.length === 0 ? (
            <EmptyState
              title="No featured products yet"
              description="Browse the full catalogue to see everything in stock."
              action={
                <Button component={NextLink} href="/products" variant="contained">
                  Browse products
                </Button>
              }
            />
          ) : (
            <ProductGrid products={featured} />
          )}
        </Section>

        <Section title="Custom Printing Services" subtitle="Bulk printing for uniforms, events and campaigns.">
          <Paper variant="outlined" sx={{ p: OUTER_SPACING }}>
            <Stack spacing={INNER_SPACING}>
              {PRINTING_SERVICES.map((service) => (
                <Typography key={service} variant="body1">
                  ✓ {service}
                </Typography>
              ))}
              <Box>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => setIsQuoteOpen(true)}
                >
                  Request Quote on WhatsApp
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Section>

        <Section title="Why Choose Manisha Readymades">
          <Box
            sx={{
              display: 'grid',
              gap: OUTER_SPACING,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            }}
          >
            {HIGHLIGHTS.map((highlight) => (
              <Paper key={highlight.title} variant="outlined" sx={{ p: INNER_SPACING }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StarIcon color="secondary" fontSize="small" />
                  <Typography variant="subtitle1">{highlight.title}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {highlight.detail}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Section>
      </PageContainer>

      <QuoteRequestDialog open={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </StoreLayout>
  );
}

/**
 * Loads banners, categories and featured products on the server.
 *
 * @returns Page props for {@link HomePage}.
 */
export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  await connectToDatabase();

  const query = await productQuerySchema.validate({ featured: true, limit: 8 });
  const [banners, categories, products] = await Promise.all([
    listBanners({ visibleOnly: true }),
    listCategories({ activeOnly: true }),
    listProducts(query),
  ]);

  return { props: { banners, categories, featured: products.items } };
};
