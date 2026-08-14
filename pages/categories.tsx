/**
 * Public category directory.
 *
 * Every category the catalogue offers, with its imagery — the destination the
 * header strip's "View all" leads to once there are more categories than the
 * strip is willing to show inline.
 *
 * @module pages/categories
 */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';

import { EmptyState } from '@/components/common/StateViews';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { connectToDatabase } from '@/lib/mongodb';
import { listBanners } from '@/services/marketing.service';
import { listCategories } from '@/services/taxonomy.service';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
import type { Banner, CategoryWithParent } from '@/types/models';

/** Props supplied by {@link getServerSideProps}. */
interface CategoriesPageProps {
  categories: CategoryWithParent[];
  banners: Banner[];
}

/**
 * The category directory.
 *
 * @param props - Server-rendered categories and banners.
 * @returns The page element.
 */
export default function CategoriesPage({ categories, banners }: CategoriesPageProps): JSX.Element {
  const topBanners = banners.filter((banner) => banner.position === 'top');
  const topLevel = categories.filter((category) => category.parent === null);

  return (
    <StoreLayout
      title="Categories"
      description="Browse every category of wholesale readymade garments — men’s, women’s and kids’ clothing."
      topBanners={topBanners}
      categories={categories}
    >
      <PageContainer>
        <Section
          title="All Categories"
          subtitle={`${topLevel.length} categor${topLevel.length === 1 ? 'y' : 'ies'} to browse.`}
        >
          {topLevel.length === 0 ? (
            <EmptyState
              title="Categories are being set up"
              description="Product categories will appear here shortly."
              action={
                <Button component={NextLink} href="/products" variant="contained">
                  Browse all products
                </Button>
              }
            />
          ) : (
            <RevealGroup
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
              {topLevel.map((parent) => {
                const children = categories.filter((child) => child.parent?._id === parent._id);
                return (
                  <RevealItem key={parent._id} sx={{ height: '100%' }}>
                    <Stack
                      sx={{
                        height: '100%',
                        overflow: 'hidden',
                        borderRadius: `${RADIUS.md}px`,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition:
                          'transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms, border-color 260ms',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: SHADOW.md,
                          borderColor: SURFACE.borderStrong,
                        },
                        '&:hover .category-card__image': { transform: 'scale(1.06)' },
                        '@media (hover: none)': {
                          '&:hover': { transform: 'none', boxShadow: 'none' },
                        },
                        '@media (prefers-reduced-motion: reduce)': {
                          '&:hover': { transform: 'none' },
                          '&:hover .category-card__image': { transform: 'none' },
                        },
                      }}
                    >
                      <Box
                        component={NextLink}
                        href={`/products?categories=${parent.slug}`}
                        sx={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                      >
                        {/* A fixed ratio whether or not the category has an
                            image, so a half-populated catalogue does not
                            produce a grid of mismatched tile heights. */}
                        <Box
                          sx={{
                            position: 'relative',
                            aspectRatio: '4 / 3',
                            overflow: 'hidden',
                            bgcolor: SURFACE.subtle,
                          }}
                        >
                          {parent.image ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                            <img
                              className="category-card__image"
                              src={parent.image.url}
                              alt={parent.image.alt ?? parent.name}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)',
                              }}
                            />
                          ) : (
                            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                              <Typography variant="caption" color="text.secondary">
                                No image
                              </Typography>
                            </Stack>
                          )}
                        </Box>

                        <Box sx={{ p: INNER_SPACING }}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography variant="h6" component="h3">
                              {parent.name}
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 15, color: 'secondary.main' }} />
                          </Stack>
                          {parent.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {parent.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/*
                        Sub-categories are listed as their own links rather than
                        being folded into the parent's. They are the level a
                        buyer actually shops at, and this is the only page that
                        shows the tree, so linking them directly saves a step.
                      */}
                      {children.length > 0 && (
                        <Box sx={{ px: INNER_SPACING, pb: INNER_SPACING, mt: 'auto' }}>
                          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                            {children.map((child) => (
                              <Box
                                key={child._id}
                                component={NextLink}
                                href={`/products?categories=${child.slug}`}
                                sx={{
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: `${RADIUS.sm}px`,
                                  bgcolor: SURFACE.subtle,
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  transition: 'background-color 160ms, color 160ms',
                                  '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                                }}
                              >
                                {child.name}
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}
        </Section>
      </PageContainer>
    </StoreLayout>
  );
}

/**
 * Loads every active category and the announcement banners.
 *
 * @returns Page props for {@link CategoriesPage}.
 */
export const getServerSideProps: GetServerSideProps<CategoriesPageProps> = async () => {
  await connectToDatabase();

  const [categories, banners] = await Promise.all([
    listCategories({ activeOnly: true }),
    listBanners({ visibleOnly: true }),
  ]);

  return { props: { categories, banners } };
};
