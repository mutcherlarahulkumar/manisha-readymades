/**
 * Product card and grid for the storefront.
 *
 * @module components/product/ProductCard
 */
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState } from 'react';

import { ProductEnquiryDialog } from '@/components/product/ProductEnquiryDialog';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { ProductListItem } from '@/types/models';
import { formatCurrency, truncate } from '@/utils/format';

/** Props for {@link ProductCard}. */
interface ProductCardProps {
  product: ProductListItem;
}

/**
 * A single product tile: image, name, price and a direct WhatsApp enquiry.
 *
 * @param props - The product to render.
 * @returns The card element.
 */
export function ProductCard({ product }: ProductCardProps): JSX.Element {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const primaryImage = product.images[0];
  const { pricing } = product;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardActionArea component={NextLink} href={`/products/${product.slug}`}>
        <Box sx={{ position: 'relative', aspectRatio: '3 / 4', bgcolor: 'grey.100' }}>
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary delivers optimised assets.
            <img
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
              <Typography variant="caption" color="text.secondary">
                No image
              </Typography>
            </Stack>
          )}

          {pricing.discountPercent > 0 && (
            <Chip
              size="small"
              color="secondary"
              label={`${pricing.discountPercent}% OFF`}
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />
          )}
        </Box>
      </CardActionArea>

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={0.5}>
          {product.brand && (
            <Typography variant="caption" color="text.secondary">
              {product.brand.name}
            </Typography>
          )}

          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
            {truncate(product.name, 52)}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {product.sku}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="h6" color="primary.main">
              {formatCurrency(pricing.finalPrice)}
            </Typography>
            {pricing.discountAmount > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(pricing.basePrice)}
              </Typography>
            )}
          </Stack>

          {product.ratingCount > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Rating value={product.ratingAverage} precision={0.1} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                ({product.ratingCount})
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      <Box sx={{ p: INNER_SPACING, pt: 0 }}>
        {/* Opens the variant picker: the enquiry must name a size and colour. */}
        <Button
          fullWidth
          size="small"
          variant="contained"
          color="success"
          startIcon={<WhatsAppIcon />}
          onClick={() => setIsEnquiryOpen(true)}
        >
          Enquire on WhatsApp
        </Button>
      </Box>

      {isEnquiryOpen && (
        <ProductEnquiryDialog
          open={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          product={product}
        />
      )}
    </Card>
  );
}

/** Props for {@link ProductGrid}. */
interface ProductGridProps {
  products: readonly ProductListItem[];
}

/**
 * Responsive grid of product cards: one column on mobile, four on desktop.
 *
 * @param props - The products to render.
 * @returns The grid element.
 */
export function ProductGrid({ products }: ProductGridProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: OUTER_SPACING,
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        },
      }}
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </Box>
  );
}
