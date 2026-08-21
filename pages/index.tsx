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
import { CatalogueDownload } from '@/components/common/CatalogueDownload';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { ProductGrid } from '@/components/product/ProductCard';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listBestSellers, listProducts } from '@/services/product.service';
import { getCatalogue } from '@/services/catalogue.service';
import { listCategories } from '@/services/taxonomy.service';
import { EASE, heroRise, staggerContainer } from '@/theme/motion';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SHELL_MAX_WIDTH, SURFACE } from '@/theme/tokens';
import type { Banner, Catalogue, CategoryWithParent, ProductListItem } from '@/types/models';
import { QuoteRequestDialog } from '@/components/quote/QuoteRequestDialog';
import { productQuerySchema } from '@/validation/product.schema';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/** Selling points shown in the "Why choose us" section. */
const HIGHLIGHTS = [
  { title: 'Since 2008', detail: 'Nearly two decades supplying retailers across the region.' },
  { title: 'Best quality', detail: 'Fabric checked before every dispatch.' },
  { title: 'Wholesale prices', detail: 'Rates that leave room for your margin.' },
  { title: 'Fast WhatsApp support', detail: 'Same-day replies on orders and stock.' },
  { title: 'Bulk orders', detail: 'Large quantities handled end to end.' },
  { title: 'Trusted by retailers', detail: 'Repeat buyers from shops and boutiques.' },
] as const;

/**
 * Caption shown beside the brand when no hero banner has been set.
 *
 * @remarks
 * Kept as a single constant so the wording can be changed in one place. Note
 * the town is spelled "Vizianagaram" here, which is the standard spelling; the
 * supplied logo artwork reads "VIZINAGAREAM". Worth settling on one.
 */
const HERO_BRAND_CAPTION = 'The best clothing store in Vizianagaram.';

/**
 * How many products each of the New Stock and Best Selling rails shows.
 *
 * @remarks
 * Exactly one row on desktop and two on a phone. The home page carries three
 * product rails; at eight apiece it would take a dozen screens of scrolling to
 * reach the rest of the page.
 */
const RAIL_SIZE = 4;

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
  /** Most recently added stock, for the New Stock rail. */
  newest: ProductListItem[];
  /** Hand-picked best sellers, topped up by enquiry volume. */
  bestSellers: ProductListItem[];
  /** The downloadable catalogue, or `null` when none is uploaded. */
  catalogue: Catalogue | null;
}

/**
 * The storefront landing page.
 *
 * @param props - Server-rendered banners, categories and featured products.
 * @returns The home page.
 */
export default function HomePage({
  banners,
  categories,
  featured,
  newest,
  bestSellers,
  catalogue,
}: HomePageProps): JSX.Element {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const topBanners = banners.filter((banner) => banner.position === 'top');
  const heroBanner = banners.find((banner) => banner.position === 'hero');

  /** Entrance for the hero's own children, sequenced behind the panel itself. */
  const heroStagger = prefersReducedMotion ? undefined : staggerContainer(0.08, 0.1);

  /*
   * The hero's picture, when the admin has set one.
   *
   * With no banner the panel shows the brand instead of borrowing a product
   * photograph. A product standing in for the shop's own hero was misleading:
   * it read as a featured item rather than as a placeholder, and it changed
   * every time the catalogue did.
   */
  const heroImage = heroBanner?.image ?? null;

  return (
    <StoreLayout topBanners={topBanners} categories={categories}>
      {/*
        Hero.

        The panel is inset from the page edge and rounded rather than run
        full-bleed, so the deep navy reads as a deliberate object on the canvas
        instead of as the page's background colour. On desktop the composition
        is asymmetric — type on the left, image on the right — which gives the
        headline a left margin to align against and stops the section looking
        like a generic centred banner.
      */}
      <Box sx={{ px: OUTER_SPACING, pt: { xs: 1.5, md: 2.5 } }}>
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
              // The type column is the wider of the two. A near-even split
              // makes the headline wrap early while the photograph has more
              // room than it needs.
              gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
              alignItems: 'stretch',
              minHeight: { xs: 'auto', md: 400 },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                px: { xs: 2.5, sm: 4, md: 6 },
                py: { xs: 4.5, sm: 5, md: 6 },
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
                {heroImage && (
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
                )}

                <m.div variants={prefersReducedMotion ? undefined : heroRise}>
                  <Typography
                    variant="h1"
                    component="h1"
                    // Capped in characters rather than pixels, so the headline
                    // breaks into balanced lines whatever the admin types into
                    // the banner title.
                    sx={{ maxWidth: '14ch', mx: { xs: 'auto', md: 0 } }}
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
                      fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                      opacity: 0.8,
                      lineHeight: 1.6,
                      maxWidth: '46ch',
                      mx: { xs: 'auto', md: 0 },
                      mt: { xs: 1.5, md: 2 },
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
                    sx={{ mt: { xs: 3, md: 3.5 } }}
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

            {!heroImage && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  px: OUTER_SPACING,
                  // Lighter below on mobile, where the text block underneath
                  // brings its own top padding and the two stacked together
                  // opened a gap wider than the brand block itself.
                  pt: { xs: 4, md: 6 },
                  pb: { xs: 0, md: 6 },
                  order: { xs: -1, md: 0 },
                  textAlign: 'center',
                }}
              >
                <m.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.94 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: EASE.emphasised, delay: 0.15 }}
                >
                  {/*
                    The mark sits on a white tile. The artwork may itself have a
                    white ground, and dropping that straight onto the navy would
                    show as a pale rectangle; giving it a deliberate tile makes
                    the same result look intended, and works for a transparent
                    file too.
                  */}
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      p: INNER_SPACING,
                      bgcolor: 'common.white',
                      borderRadius: `${RADIUS.lg}px`,
                      boxShadow: SHADOW.lg,
                    }}
                  >
                    <BrandLogo size={92} />
                  </Box>
                </m.div>

                <m.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE.standard, delay: 0.28 }}
                >
                  <Typography
                    component="p"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    Manisha Readymades
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.75, mt: 1, maxWidth: '30ch', mx: 'auto' }}
                  >
                    {HERO_BRAND_CAPTION}
                  </Typography>
                </m.div>
              </Box>
            )}

            {heroImage && (
              <Box
                sx={{
                  position: 'relative',
                  minHeight: { xs: 200, sm: 280, md: 'auto' },
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
                    src={heroImage.url}
                    alt={heroImage.alt ?? ''}
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
                    // Multi-stop, and eased rather than linear. A two-stop
                    // gradient over a photograph shows a visible band where the
                    // ramp begins; the extra stops spread that transition out
                    // until the image simply dissolves into the panel.
                    background: {
                      xs: `linear-gradient(to bottom,
                        rgba(15,27,61,0.10) 0%,
                        rgba(15,27,61,0.25) 35%,
                        rgba(15,27,61,0.65) 70%,
                        rgba(15,27,61,0.92) 88%,
                        ${SURFACE.inverse} 100%)`,
                      md: `linear-gradient(to right,
                        ${SURFACE.inverse} 0%,
                        rgba(15,27,61,0.94) 12%,
                        rgba(15,27,61,0.70) 30%,
                        rgba(15,27,61,0.34) 52%,
                        rgba(15,27,61,0.10) 74%,
                        rgba(15,27,61,0.02) 100%)`,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <PageContainer>

        {/* The catalogue sits above the rails: a retailer who wants the whole
            range in one file should not have to scroll past three of them. */}
        {catalogue && (
          <Box sx={{ pt: { xs: 3, md: 5 } }}>
            <Reveal>
              <CatalogueDownload catalogue={catalogue} />
            </Reveal>
          </Box>
        )}

        {/*
          Three product rails run in decreasing order of how much a wholesale
          buyer is likely to act on them: what just landed, what everyone else
          is buying, then the owner's own picks. Each is short — one desktop row
          — so the page stays scannable rather than becoming three catalogues
          stacked on top of each other.
        */}
        {newest.length > 0 && (
          <Section
            title="New Stock"
            subtitle="The latest arrivals, freshly added to the catalogue."
            action={
              <Button
                component={NextLink}
                href="/products?sort=newest"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
              >
                See what’s new
              </Button>
            }
          >
            <ProductGrid products={newest} />
          </Section>
        )}

        {bestSellers.length > 0 && (
          <Section
            title="Best Selling"
            subtitle="What retailers are ordering most."
            action={
              <Button
                component={NextLink}
                href="/products"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
              >
                Browse all
              </Button>
            }
          >
            <ProductGrid products={bestSellers} />
          </Section>
        )}

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
                p: OUTER_SPACING,
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
                    p: INNER_SPACING,
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

  // Each rail is its own short row rather than one long grid, so they are
  // fetched with their own limits and run together.
  const [featuredQuery, newestQuery] = await Promise.all([
    productQuerySchema.validate({ featured: true, limit: 8 }),
    productQuerySchema.validate({ sort: 'newest', limit: RAIL_SIZE }),
  ]);

  const [banners, categories, featured, newest, bestSellers, catalogue] = await Promise.all([
    listBanners({ visibleOnly: true }),
    listCategories({ activeOnly: true }),
    listProducts(featuredQuery),
    listProducts(newestQuery),
    listBestSellers(RAIL_SIZE),
    getCatalogue(),
  ]);

  return {
    props: {
      banners,
      categories,
      featured: featured.items,
      newest: newest.items,
      bestSellers,
      catalogue,
    },
  };
};
