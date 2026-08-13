/**
 * Public product detail page.
 *
 * The only conversion path is WhatsApp: there is no cart and no checkout, so
 * the enquiry button carries the full product context for the owner.
 *
 * @module pages/products/[slug]
 */
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Reveal } from '@/components/motion/Reveal';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductEnquiryDialog } from '@/components/product/ProductEnquiryDialog';
import { ProductReviews } from '@/components/product/ProductReviews';
import { trackEvent } from '@/lib/analytics';
import { api } from '@/lib/http';
import { connectToDatabase } from '@/lib/mongodb';
import { getProduct, listProducts } from '@/services/product.service';
import { listApprovedReviews } from '@/services/marketing.service';
import { listCategories } from '@/services/taxonomy.service';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE, stickyContentTop } from '@/theme/tokens';
import type { CategoryWithParent, ProductListItem, Review } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { productQuerySchema } from '@/validation/product.schema';

/** Height reserved for the fixed mobile enquiry bar, in pixels. */
const MOBILE_CTA_HEIGHT = 76;

/** Props supplied by {@link getServerSideProps}. */
interface ProductDetailPageProps {
  product: ProductListItem;
  initialReviews: Review[];
  related: ProductListItem[];
  /** Feeds the category strip beneath the header. */
  categories: CategoryWithParent[];
}

/**
 * The product detail page.
 *
 * @param props - The product, its approved reviews and related products.
 * @returns The detail page.
 */
export default function ProductDetailPage({
  product,
  initialReviews,
  related,
  categories,
}: ProductDetailPageProps): JSX.Element {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isReloading, setIsReloading] = useState(false);
  const [reviewError, setReviewError] = useState<unknown>(undefined);
  const [activeImage, setActiveImage] = useState(0);

  // Recorded once per visit so the analytics dashboard can rank products by
  // interest rather than by guesswork.
  useEffect(() => {
    trackEvent('product_view', product._id);
  }, [product._id]);

  const reloadReviews = useCallback(async (): Promise<void> => {
    setIsReloading(true);
    setReviewError(undefined);
    try {
      setReviews(await api<Review[]>(`/api/products/${product._id}/reviews`, { anonymous: true }));
    } catch (error) {
      setReviewError(error);
    } finally {
      setIsReloading(false);
    }
  }, [product._id]);

  const { pricing } = product;
  const currentImage = product.images[activeImage] ?? product.images[0];

  return (
    <StoreLayout
      title={product.name}
      description={product.description ?? undefined}
      categories={categories}
    >
      {/* The page reserves room for the fixed mobile enquiry bar so the last
          element on the page is never trapped underneath it. */}
      <Box sx={{ pb: { xs: `${MOBILE_CTA_HEIGHT}px`, md: 0 } }}>
        <PageContainer>
          <Breadcrumbs
            sx={{
              mb: OUTER_SPACING,
              fontSize: '0.8125rem',
              // A long product name must not push the trail into a second line
              // of overflow on a phone.
              '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' },
            }}
          >
            <Link component={NextLink} href="/" underline="hover" color="text.secondary">
              Home
            </Link>
            <Link component={NextLink} href="/products" underline="hover" color="text.secondary">
              Products
            </Link>
            <Link
              component={NextLink}
              href={`/products?categories=${product.category.slug}`}
              underline="hover"
              color="text.secondary"
            >
              {product.category.name}
            </Link>
            <Typography color="text.primary" variant="body2" sx={{ fontWeight: 600 }}>
              {product.name}
            </Typography>
          </Breadcrumbs>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 6 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
              alignItems: 'start',
            }}
          >
            {/* Gallery */}
            <Box
              sx={{
                // The gallery stays in view while the specification list is
                // read on desktop — the picture is the thing being judged.
                position: { md: 'sticky' },
                top: { md: stickyContentTop(categories.length > 0) },
              }}
            >
              <Box
                sx={{
                  aspectRatio: '3 / 4',
                  bgcolor: SURFACE.subtle,
                  borderRadius: `${RADIUS.md}px`,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {currentImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                  <img
                    key={currentImage.publicId}
                    src={currentImage.url}
                    alt={currentImage.alt ?? product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </Box>

              {product.images.length > 1 && (
                <Stack
                  direction="row"
                  spacing={INNER_SPACING}
                  sx={{
                    mt: INNER_SPACING,
                    // Many thumbnails scroll horizontally inside their own strip
                    // rather than wrapping into a block that shifts the layout.
                    overflowX: 'auto',
                    pb: 0.5,
                    scrollbarWidth: 'thin',
                  }}
                >
                  {product.images.map((image, index) => {
                    const isActive = index === activeImage;
                    return (
                      <Box
                        key={image.publicId}
                        component="button"
                        type="button"
                        aria-label={`View image ${index + 1}`}
                        aria-pressed={isActive}
                        onClick={() => setActiveImage(index)}
                        sx={{
                          flexShrink: 0,
                          width: 68,
                          height: 68,
                          p: 0,
                          cursor: 'pointer',
                          borderRadius: `${RADIUS.sm}px`,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: isActive ? 'primary.main' : 'divider',
                          background: 'none',
                          opacity: isActive ? 1 : 0.72,
                          transition: 'border-color 180ms, opacity 180ms',
                          '&:hover': { opacity: 1, borderColor: 'primary.light' },
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                        <img
                          src={image.url}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Details */}
            <Box>
              {product.brand && (
                <Typography variant="overline" color="text.secondary" component="p">
                  {product.brand.name}
                </Typography>
              )}

              <Typography variant="h2" component="h1" sx={{ mt: 0.5 }}>
                {product.name}
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mt: 1.5, flexWrap: 'wrap' }}
              >
                <Typography variant="body2" color="text.secondary">
                  SKU: {product.sku}
                </Typography>

                {product.ratingCount > 0 && (
                  <>
                    <Box sx={{ width: '1px', height: 14, bgcolor: 'divider' }} />
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Rating value={product.ratingAverage} precision={0.1} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {product.ratingAverage.toFixed(1)} ({product.ratingCount} review
                        {product.ratingCount === 1 ? '' : 's'})
                      </Typography>
                    </Stack>
                  </>
                )}
              </Stack>

              {/* The price block sits on a tinted panel: it is the single most
                  looked-for number on the page, and giving it its own surface
                  means the eye finds it without a heading. */}
              <Box
                sx={{
                  mt: 3,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: `${RADIUS.md}px`,
                  bgcolor: SURFACE.subtle,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="h3" component="p" color="primary.main">
                    {formatCurrency(pricing.finalPrice)}
                  </Typography>
                  {pricing.discountAmount > 0 && (
                    <>
                      <Typography
                        variant="h6"
                        component="p"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through', fontWeight: 500 }}
                      >
                        {formatCurrency(pricing.basePrice)}
                      </Typography>
                      <Chip
                        size="small"
                        color="secondary"
                        label={`${pricing.discountPercent}% off${
                          pricing.appliedDiscountTitle ? ` · ${pricing.appliedDiscountTitle}` : ''
                        }`}
                      />
                    </>
                  )}
                </Stack>
              </Box>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" component="h2">
                    Available sizes
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {product.sizes.map((size) => (
                      <Chip key={size} label={size} variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary" component="h2">
                    Colours
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {product.colors.map((color) => (
                      <Chip key={color} label={color} variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                {product.description && (
                  <Box>
                    <Typography variant="overline" color="text.secondary" component="h2">
                      Description
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-line', mt: 1 }}
                    >
                      {product.description}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* The inline call to action is the desktop one. On mobile the
                  fixed bar below takes over, so this is hidden there rather
                  than duplicated. */}
              <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 4 }}>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => setIsEnquiryOpen(true)}
                >
                  Enquire on WhatsApp
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1.5 }}
                >
                  Choose your size, colour and quantity — we will reply with wholesale rates on
                  WhatsApp.
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: 'block', md: 'none' }, mt: 3 }}
              >
                Choose your size, colour and quantity — we will reply with wholesale rates on
                WhatsApp.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 10 } }} />

          <Reveal>
            <ProductReviews
              productId={product._id}
              reviews={reviews}
              isLoading={isReloading}
              error={reviewError}
              onSubmitted={() => void reloadReviews()}
            />
          </Reveal>

          {related.length > 0 && (
            <Box sx={{ mt: { xs: 6, md: 10 } }}>
              <Section title="You may also like">
                <ProductGrid products={related} />
              </Section>
            </Box>
          )}
        </PageContainer>
      </Box>

      {/*
        The mobile enquiry bar.

        The site's only conversion path must not scroll away on the device most
        visitors use. It is the same button opening the same dialog — pinned,
        not duplicated in behaviour — and it carries the bottom safe-area inset
        so it clears the home indicator on modern phones.
      */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          px: 2,
          pt: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: SHADOW.lg,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ minWidth: 0, flexShrink: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2 }}>
              {formatCurrency(pricing.finalPrice)}
            </Typography>
            {pricing.discountAmount > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(pricing.basePrice)}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<WhatsAppIcon />}
            onClick={() => setIsEnquiryOpen(true)}
            sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}
          >
            Enquire on WhatsApp
          </Button>
        </Stack>
      </Box>

      <ProductEnquiryDialog
        open={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        product={product}
      />
    </StoreLayout>
  );
}

/**
 * Loads the product, its approved reviews and related items by slug.
 *
 * @param context - The Next.js context, carrying the slug parameter.
 * @returns Page props, or a 404 when the product is missing or inactive.
 */
export const getServerSideProps: GetServerSideProps<ProductDetailPageProps> = async (context) => {
  const slug = typeof context.params?.slug === 'string' ? context.params.slug : null;
  if (!slug) return { notFound: true };

  await connectToDatabase();

  try {
    const product = await getProduct({ slug });
    const relatedQuery = await productQuerySchema.validate({
      categories: product.category.slug,
      limit: 4,
    });
    const [reviews, relatedResult, categories] = await Promise.all([
      listApprovedReviews(product._id),
      listProducts(relatedQuery),
      listCategories({ activeOnly: true }),
    ]);

    return {
      props: {
        product,
        initialReviews: reviews,
        related: relatedResult.items.filter((item) => item._id !== product._id).slice(0, 4),
        categories,
      },
    };
  } catch {
    // getProduct throws 404 for missing or unpublished products.
    return { notFound: true };
  }
};
