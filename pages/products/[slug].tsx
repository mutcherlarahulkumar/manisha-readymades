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
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductEnquiryDialog } from '@/components/product/ProductEnquiryDialog';
import { ProductReviews } from '@/components/product/ProductReviews';
import { trackEvent } from '@/lib/analytics';
import { api } from '@/lib/http';
import { connectToDatabase } from '@/lib/mongodb';
import { getProduct, listProducts } from '@/services/product.service';
import { listApprovedReviews } from '@/services/marketing.service';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { ProductListItem, Review } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { productQuerySchema } from '@/validation/product.schema';

/** Props supplied by {@link getServerSideProps}. */
interface ProductDetailPageProps {
  product: ProductListItem;
  initialReviews: Review[];
  related: ProductListItem[];
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
    <StoreLayout title={product.name} description={product.description ?? undefined}>
      <PageContainer>
        <Breadcrumbs sx={{ mb: OUTER_SPACING }}>
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Home
          </Link>
          <Link component={NextLink} href="/products" underline="hover" color="inherit">
            Products
          </Link>
          <Link
            component={NextLink}
            href={`/products?categories=${product.category.slug}`}
            underline="hover"
            color="inherit"
          >
            {product.category.name}
          </Link>
          <Typography color="text.primary">{product.name}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gap: OUTER_SPACING,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          {/* Gallery */}
          <Box>
            <Box
              sx={{
                aspectRatio: '3 / 4',
                bgcolor: 'grey.100',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {currentImage && (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                <img
                  src={currentImage.url}
                  alt={currentImage.alt ?? product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </Box>

            {product.images.length > 1 && (
              <Stack direction="row" spacing={INNER_SPACING} sx={{ mt: INNER_SPACING, flexWrap: 'wrap' }}>
                {product.images.map((image, index) => (
                  <Box
                    key={image.publicId}
                    component="button"
                    type="button"
                    aria-label={`View image ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    sx={{
                      width: 72,
                      height: 72,
                      p: 0,
                      cursor: 'pointer',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: index === activeImage ? 'primary.main' : 'divider',
                      background: 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                    <img
                      src={image.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Details */}
          <Stack spacing={INNER_SPACING}>
            {product.brand && (
              <Typography variant="body2" color="text.secondary">
                {product.brand.name}
              </Typography>
            )}

            <Typography variant="h2" component="h1">
              {product.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku}
            </Typography>

            {product.ratingCount > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Rating value={product.ratingAverage} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {product.ratingAverage.toFixed(1)} ({product.ratingCount} review
                  {product.ratingCount === 1 ? '' : 's'})
                </Typography>
              </Stack>
            )}

            <Stack direction="row" spacing={INNER_SPACING} alignItems="baseline">
              <Typography variant="h3" color="primary.main">
                {formatCurrency(pricing.finalPrice)}
              </Typography>
              {pricing.discountAmount > 0 && (
                <>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
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

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available sizes
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {product.sizes.map((size) => (
                  <Chip key={size} label={size} variant="outlined" />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Colours
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {product.colors.map((color) => (
                  <Chip key={color} label={color} variant="outlined" />
                ))}
              </Stack>
            </Box>

            {product.description && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {product.description}
                </Typography>
              </Box>
            )}

            {/* Opens the variant picker so the enquiry names a size and colour. */}
            <Button
              size="large"
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => setIsEnquiryOpen(true)}
            >
              Enquire on WhatsApp
            </Button>

            <Typography variant="caption" color="text.secondary">
              Choose your size, colour and quantity — we will reply with wholesale rates on
              WhatsApp.
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ my: OUTER_SPACING }} />

        <ProductReviews
          productId={product._id}
          reviews={reviews}
          isLoading={isReloading}
          error={reviewError}
          onSubmitted={() => void reloadReviews()}
        />

        {related.length > 0 && (
          <Section title="You may also like">
            <ProductGrid products={related} />
          </Section>
        )}
      </PageContainer>

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
    const [reviews, relatedResult] = await Promise.all([
      listApprovedReviews(product._id),
      listProducts(relatedQuery),
    ]);

    return {
      props: {
        product,
        initialReviews: reviews,
        related: relatedResult.items.filter((item) => item._id !== product._id).slice(0, 4),
      },
    };
  } catch {
    // getProduct throws 404 for missing or unpublished products.
    return { notFound: true };
  }
};
