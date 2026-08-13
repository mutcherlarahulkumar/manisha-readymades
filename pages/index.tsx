/**
 * Storefront home page.
 *
 * Server-rendered so the catalogue is indexable and the first paint already
 * contains products. Data is read through the service layer on the server —
 * the browser never touches MongoDB.
 *
 * @module pages/index
 */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'framer-motion';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useState } from 'react';

import { EmptyState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { ProductGrid } from '@/components/product/ProductCard';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listProducts } from '@/services/product.service';
import { listCategories } from '@/services/taxonomy.service';
import { EASE, heroRise, staggerContainer } from '@/theme/motion';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SHELL_MAX_WIDTH, SURFACE } from '@/theme/tokens';
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
  const prefersReducedMotion = useReducedMotion();
  const topBanners = banners.filter((banner) => banner.position === 'top');
  const heroBanner = banners.find((banner) => banner.position === 'hero');
  const topLevelCategories = categories.filter((category) => category.parent === null);

  /** Entrance for the hero's own children, sequenced behind the panel itself. */
  const heroStagger = prefersReducedMotion ? undefined : staggerContainer(0.08, 0.1);

  return (
    <StoreLayout topBanners={topBanners}>
      {/*
        Hero.

        The panel is inset from the page edge and rounded rather than run
        full-bleed, so the deep navy reads as a deliberate object on the canvas
        instead of as the page's background colour. On desktop the composition
        is asymmetric — type on the left, image on the right — which gives the
        headline a left margin to align against and stops the section looking
        like a generic centred banner.
      */}
      <Box sx={{ px: OUTER_SPACING, pt: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            maxWidth: SHELL_MAX_WIDTH,
            mx: 'auto',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: `${RADIUS.md}px`, md: `${RADIUS.lg}px` },
            bgcolor: SURFACE.inverse,
            color: 'common.white',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: heroBanner ? '1.05fr 0.95fr' : '1fr' },
              alignItems: 'stretch',
              minHeight: { xs: 'auto', md: 480 },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                px: { xs: 3, sm: 5, md: 7 },
                py: { xs: 6, sm: 7, md: 9 },
                display: 'flex',
                alignItems: 'center',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <m.div
                variants={heroStagger}
                initial={prefersReducedMotion ? undefined : 'hidden'}
                animate={prefersReducedMotion ? undefined : 'visible'}
                style={{ width: '100%' }}
              >
                <m.div variants={prefersReducedMotion ? undefined : heroRise}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'secondary.light',
                      display: 'block',
                      mb: { xs: 1.5, md: 2 },
                    }}
                  >
                    Manisha Readymades
                  </Typography>
                </m.div>

                <m.div variants={prefersReducedMotion ? undefined : heroRise}>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{ maxWidth: 620, mx: { xs: 'auto', md: 0 } }}
                  >
                    {heroBanner?.title ?? 'Wholesale Garment Supplier'}
                  </Typography>
                </m.div>

                <m.div variants={prefersReducedMotion ? undefined : heroRise}>
                  <Typography
                    variant="h6"
                    component="p"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      opacity: 0.82,
                      lineHeight: 1.6,
                      maxWidth: 520,
                      mx: { xs: 'auto', md: 0 },
                      mt: { xs: 2, md: 2.5 },
                    }}
                  >
                    {heroBanner?.subtitle ?? 'Premium clothing at wholesale prices.'}
                  </Typography>
                </m.div>

                <m.div variants={prefersReducedMotion ? undefined : heroRise}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={INNER_SPACING}
                    justifyContent={{ xs: 'center', md: 'flex-start' }}
                    sx={{ mt: { xs: 4, md: 5 } }}
                  >
                    <Button
                      component={NextLink}
                      href="/products"
                      variant="contained"
                      color="secondary"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                    >
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
                </m.div>
              </m.div>
            </Box>

            {heroBanner && (
              <Box
                sx={{
                  position: 'relative',
                  minHeight: { xs: 260, sm: 340, md: 'auto' },
                  order: { xs: -1, md: 0 },
                }}
              >
                <m.div
                  initial={prefersReducedMotion ? undefined : { scale: 1.12, opacity: 0 }}
                  animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: EASE.emphasised }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                  <img
                    src={heroBanner.image.url}
                    alt={heroBanner.image.alt ?? heroBanner.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </m.div>

                {/*
                  The image is blended into the panel rather than boxed inside
                  it. A single directional scrim fades the photograph into the
                  navy along the edge that meets the type — sideways on desktop,
                  downwards on mobile where the image sits above the headline.
                  This is what stops the hero looking like a picture pasted into
                  a rectangle.
                */}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: {
                      xs: `linear-gradient(to bottom, rgba(15,27,61,0.15) 0%, rgba(15,27,61,0.55) 60%, ${SURFACE.inverse} 100%)`,
                      md: `linear-gradient(to right, ${SURFACE.inverse} 0%, rgba(15,27,61,0.55) 32%, rgba(15,27,61,0.05) 100%)`,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <PageContainer>
        <Section title="Categories" subtitle="Shop by what your customers ask for most.">
          {topLevelCategories.length === 0 ? (
            <EmptyState
              title="Categories are being set up"
              description="Product categories will appear here shortly."
            />
          ) : (
            <RevealGroup
              sx={{
                display: 'grid',
                gap: { xs: 1.5, md: 3 },
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
              }}
            >
              {topLevelCategories.map((category) => (
                <RevealItem key={category._id} sx={{ height: '100%' }}>
                  <Box
                    component={NextLink}
                    href={`/products?categories=${category.slug}`}
                    sx={{
                      display: 'block',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: `${RADIUS.md}px`,
                      textDecoration: 'none',
                      bgcolor: SURFACE.subtle,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: SHADOW.md },
                      '&:hover .category-tile__image': { transform: 'scale(1.06)' },
                      '@media (hover: none)': { '&:hover': { transform: 'none', boxShadow: 'none' } },
                      '@media (prefers-reduced-motion: reduce)': {
                        '&:hover': { transform: 'none' },
                        '&:hover .category-tile__image': { transform: 'none' },
                      },
                    }}
                  >
                    {/* A fixed ratio whether or not the category has an image,
                        so a half-populated catalogue does not produce a grid of
                        mismatched tile heights. */}
                    <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
                      {category.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                        <img
                          className="category-tile__image"
                          src={category.image.url}
                          alt={category.image.alt ?? category.name}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)',
                          }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', bgcolor: SURFACE.subtle }} />
                      )}

                      {/* The label sits on the image behind a bottom-weighted
                          scrim, which keeps the text legible over any
                          photograph the admin uploads. */}
                      <Box
                        aria-hidden
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(to top, rgba(15,27,61,0.88) 0%, rgba(15,27,61,0.35) 45%, rgba(15,27,61,0) 75%)',
                        }}
                      />

                      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{ color: 'common.white', fontWeight: 700 }}
                          >
                            {category.name}
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 16, color: 'secondary.light' }} />
                        </Stack>
                        {category.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'common.white',
                              opacity: 0.8,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </Section>

        <Section
          title="Featured Products"
          subtitle="Hand-picked stock, ready to ship."
          action={
            <Button
              component={NextLink}
              href="/products"
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
            >
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
          {/*
            A two-column editorial block rather than a bordered card. The
            services are the content; wrapping them in a panel would add a
            border for no organisational benefit, and the section reads better
            with the air.
          */}
          <Reveal>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 4, md: 6 },
                alignItems: 'center',
                p: { xs: 3, md: 5 },
                borderRadius: `${RADIUS.lg}px`,
                bgcolor: SURFACE.subtle,
              }}
            >
              <Stack spacing={1.5}>
                {PRINTING_SERVICES.map((service) => (
                  <Stack key={service} direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        color: 'common.white',
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {service}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Box>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => setIsQuoteOpen(true)}
                >
                  Request Quote on WhatsApp
                </Button>
              </Box>
            </Box>
          </Reveal>
        </Section>

        <Section title="Why Choose Manisha Readymades">
          <RevealGroup
            sx={{
              display: 'grid',
              // A one-pixel gap over a tinted background turns the grid into a
              // set of hairline-separated cells: the structure of a table with
              // none of the boxiness of six individual outlined cards.
              gap: '1px',
              bgcolor: SURFACE.border,
              border: '1px solid',
              borderColor: SURFACE.border,
              borderRadius: `${RADIUS.md}px`,
              overflow: 'hidden',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {HIGHLIGHTS.map((highlight) => (
              <RevealItem key={highlight.title} sx={{ height: '100%' }}>
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: 'background.paper',
                    p: { xs: 2.5, md: 3 },
                    transition: 'background-color 200ms',
                    '&:hover': { bgcolor: SURFACE.subtle },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <StarIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    <Typography variant="subtitle1" component="h3">
                      {highlight.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {highlight.detail}
                  </Typography>
                </Box>
              </RevealItem>
            ))}
          </RevealGroup>
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
