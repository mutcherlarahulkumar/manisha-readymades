/**
 * Product card and grid for the storefront.
 *
 * @module components/product/ProductCard
 */
import StarIcon from '@mui/icons-material/Star';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState } from 'react';

import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { ProductEnquiryDialog } from '@/components/product/ProductEnquiryDialog';
import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
import type { ProductListItem } from '@/types/models';
import { formatCurrency } from '@/utils/format';

/** Props for {@link ProductCard}. */
interface ProductCardProps {
  product: ProductListItem;
}

/**
 * A single product tile: image, name, price and a direct WhatsApp enquiry.
 *
 * @param props - The product to render.
 * @returns The card element.
 *
 * @remarks
 * The enquiry button is always rendered rather than revealed on hover. Hiding a
 * card's only call to action behind a pointer event makes it unreachable by
 * touch and by keyboard, which is too high a price for the small amount of
 * visual quiet it buys. The hover treatment is spent instead on the image, the
 * elevation and the title colour.
 */
export function ProductCard({ product }: ProductCardProps): JSX.Element {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1];
  const { pricing } = product;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms, border-color 260ms',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: SHADOW.md,
          borderColor: SURFACE.borderStrong,
        },
        // The lift is decorative; a visitor who has asked for less motion still
        // gets the shadow and border cues.
        '@media (prefers-reduced-motion: reduce)': {
          '&:hover': { transform: 'none' },
        },
        // Hover styles are meaningless on touch and, worse, "stick" after a tap
        // on iOS. Scoped to devices with a real pointer.
        '@media (hover: none)': {
          '&:hover': { transform: 'none', boxShadow: 'none' },
        },
        '&:hover .product-card__image': { transform: 'scale(1.05)' },
        '&:hover .product-card__image--secondary': { opacity: 1 },
        '&:hover .product-card__title': { color: 'primary.main' },
      }}
    >
      <CardActionArea component={NextLink} href={`/products/${product.slug}`}>
        <Box
          sx={{
            position: 'relative',
            // 4:5 rather than 3:4. Garment photography still reads clearly at
            // this ratio, and the shorter card puts appreciably more of the
            // grid above the fold.
            aspectRatio: '4 / 5',
            bgcolor: SURFACE.subtle,
            overflow: 'hidden',
          }}
        >
          {primaryImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary delivers optimised assets. */}
              <img
                className="product-card__image"
                src={primaryImage.url}
                alt={primaryImage.alt ?? product.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />

              {/* A second photograph, where the product already has one, cross-
                  fades in on hover — the closest thing to picking the garment up
                  and turning it over. Nothing is added when there is no second
                  image. */}
              {secondaryImage && (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                <img
                  className="product-card__image product-card__image--secondary"
                  src={secondaryImage.url}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0,
                    transition: 'opacity 420ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              )}
            </>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
              <Typography variant="caption" color="text.secondary">
                No image
              </Typography>
            </Stack>
          )}

          {pricing.discountPercent > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                px: 1,
                py: 0.25,
                borderRadius: `${RADIUS.sm}px`,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: SHADOW.xs,
              }}
            >
              {pricing.discountPercent}% OFF
            </Box>
          )}
        </Box>
      </CardActionArea>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {product.brand && (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontSize: '0.625rem', lineHeight: 1.4 }}
          >
            {product.brand.name}
          </Typography>
        )}

        {/* Clamped to two lines rather than truncated by character count, so
            every card in a row is the same height and the price line below sits
            on a shared baseline across the grid. */}
        <Typography
          className="product-card__title"
          variant="subtitle2"
          component="h3"
          title={product.name}
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.4,
            transition: 'color 200ms',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8em',
          }}
        >
          {product.name}
        </Typography>

        <Typography variant="caption" color="text.secondary" noWrap>
          {product.sku}
        </Typography>

        <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ flexWrap: 'wrap', mt: 0.25 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>
            {formatCurrency(pricing.finalPrice)}
          </Typography>
          {pricing.discountAmount > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(pricing.basePrice)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                {pricing.discountPercent}% off
              </Typography>
            </>
          )}
        </Stack>

        {product.ratingCount > 0 && (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            aria-label={`Rated ${product.ratingAverage.toFixed(1)} out of 5 from ${product.ratingCount} reviews`}
            sx={{
              alignSelf: 'flex-start',
              mt: 0.5,
              px: 0.75,
              py: 0.25,
              borderRadius: `${RADIUS.sm}px`,
              bgcolor: SURFACE.subtle,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {product.ratingAverage.toFixed(1)}
            </Typography>
            <StarIcon sx={{ fontSize: 12, color: 'secondary.main' }} />
            <Box sx={{ width: '1px', height: 10, bgcolor: 'divider' }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              {product.ratingCount}
            </Typography>
          </Stack>
        )}
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
          aria-label={`Enquire about ${product.name} on WhatsApp`}
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
 * Responsive grid of product cards: two columns on mobile, four on desktop.
 *
 * @param props - The products to render.
 * @returns The grid element.
 *
 * @remarks
 * Cards enter in sequence as the grid scrolls into view. The stagger is applied
 * per card index rather than per row, which is why it is kept short — at 0.05s
 * a full page of products finishes arriving well inside half a second.
 */
export function ProductGrid({ products }: ProductGridProps): JSX.Element {
  return (
    <RevealGroup
      stagger={0.05}
      sx={{
        display: 'grid',
        // A tighter gutter on phones: at two columns, the 24px desktop gap eats
        // width the product photography needs more than the layout does.
        gap: { xs: 1.5, md: 3 },
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {products.map((product) => (
        <RevealItem key={product._id} sx={{ height: '100%' }}>
          <ProductCard product={product} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
