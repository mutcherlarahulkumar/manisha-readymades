/**
 * Storefront shell: promotional banner strip, navigation header, and footer.
 *
 * @module components/layout/StoreLayout
 */
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'framer-motion';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';

import { BrandLogo } from '@/components/layout/BrandLogo';
import { CategoryStrip } from '@/components/layout/CategoryStrip';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
import { useScrolled } from '@/hooks/useScrolled';
import { publicEnv } from '@/lib/env';
import { DURATION, EASE, staggerContainer } from '@/theme/motion';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import {
  ANNOUNCEMENT_HEIGHT,
  HEADER_HEIGHT,
  RADIUS,
  SHADOW,
  SHELL_MAX_WIDTH,
  SURFACE,
} from '@/theme/tokens';
import type { Banner, CategoryWithParent } from '@/types/models';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/** Primary storefront navigation. */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/custom-printing', label: 'Custom Printing' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * Footer navigation: the header's entries plus the two directory pages.
 *
 * @remarks
 * Categories and Brands are deliberately not in the header. The category strip
 * already covers browsing by category, and adding two more items to a
 * four-item bar would cost more clarity than the directories are worth up
 * there. The footer is where a visitor looks for the full index of a site.
 */
const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: '/categories', label: 'Categories' },
  { href: '/brands', label: 'Brands' },
] as const;

/**
 * Reports whether a navigation entry matches the current route.
 *
 * @param pathname - The router's current pathname.
 * @param href - The entry's target.
 * @returns `true` when the entry should read as active.
 *
 * @remarks
 * `/` would otherwise prefix-match every route, so the home entry is compared
 * exactly while the rest match their sub-pages — the product detail page keeps
 * "Products" highlighted.
 */
function isActiveRoute(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** Props for {@link NavLink}. */
interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

/**
 * A desktop navigation link with an underline that grows from the centre.
 *
 * @param props - Target, label and active state.
 * @returns The link element.
 *
 * @remarks
 * The underline is a pseudo-element scaled on the X axis rather than an
 * animated `width`, so hovering the navigation never triggers layout.
 */
function NavLink({ href, label, isActive }: NavLinkProps): JSX.Element {
  return (
    <Box
      component={NextLink}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        position: 'relative',
        px: 0.5,
        py: 1,
        fontSize: '0.9375rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'primary.main' : 'text.primary',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'color 180ms',
        '&:hover': { color: 'primary.main' },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 2,
          height: 2,
          borderRadius: 2,
          bgcolor: 'primary.main',
          transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'center',
          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
        '&:hover::after': { transform: 'scaleX(1)' },
      }}
    >
      {label}
    </Box>
  );
}

/** Props for {@link StoreLayout}. */
interface StoreLayoutProps {
  children: ReactNode;
  /** Browser tab title; the brand name is appended automatically. */
  title?: string;
  /** Meta description for search engines. */
  description?: string;
  /**
   * Banners with position `top`. There is only ever one, but the storefront
   * pages pass what the service returned, so the first is taken here.
   */
  topBanners?: Banner[];
  /**
   * Categories for the strip beneath the header.
   *
   * Supplied by the pages that already load the taxonomy for their own use —
   * the home page and the catalogue. The two static marketing pages omit it
   * rather than acquiring a server round-trip purely to draw navigation.
   */
  categories?: readonly CategoryWithParent[];
  /**
   * Pixels of clearance to add beneath the footer on phones, for pages that
   * pin a control to the bottom of the viewport.
   *
   * @remarks
   * The page cannot solve this itself. Its own bottom padding lives inside
   * `children`, and the footer renders after them — so a fixed bar covers the
   * end of the footer no matter how much padding the page adds. The spacer has
   * to sit inside the footer to keep its background colour, rather than below
   * it where it would show a band of page canvas.
   */
  mobileBottomInset?: number;
}

/**
 * Wraps every public page.
 *
 * @param props - Page content and document metadata.
 * @returns The storefront shell.
 */
export function StoreLayout({
  children,
  title,
  description = 'Wholesale readymade garments — men’s, women’s and kids’ clothing at wholesale prices.',
  topBanners = [],
  categories = [],
  mobileBottomInset = 0,
}: StoreLayoutProps): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const isScrolled = useScrolled(8);
  const announcement = topBanners[0];
  const prefersReducedMotion = useReducedMotion();
  const pageTitle = title ? `${title} · Manisha Readymades` : 'Manisha Readymades · Wholesale Garment Supplier';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
      </Head>

      {/*
        The announcement bar.

        One line of admin-controlled text, optionally with a button. Deliberately
        not sticky: it is an announcement, not a control, and pinning it would
        cost a slice of every screen for the life of the session. It carries the
        accent amber rather than the navy used by the header and footer, so a
        promotion reads as a promotion instead of as another band of site chrome.
      */}
      {announcement && (
        <Box
          role="region"
          aria-label="Announcement"
          sx={{
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            minHeight: ANNOUNCEMENT_HEIGHT,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Container sx={{ maxWidth: `${SHELL_MAX_WIDTH}px !important` }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{ gap: { xs: 1, sm: 1.5 }, py: 0.75, flexWrap: 'wrap' }}
            >
              <LocalOfferIcon sx={{ fontSize: 14, flexShrink: 0, opacity: 0.9 }} />
              <Typography
                variant="caption"
                component="p"
                sx={{ fontWeight: 600, letterSpacing: '0.02em' }}
              >
                {announcement.title}
              </Typography>

              {/* The button appears only when the admin gave it both a label and
                  a destination; either alone is rejected at validation. */}
              {announcement.ctaLabel && announcement.link && (
                <Box
                  component={announcement.link.startsWith('/') ? NextLink : 'a'}
                  href={announcement.link}
                  {...(announcement.link.startsWith('/')
                    ? {}
                    : { target: '_blank', rel: 'noopener noreferrer' })}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 1.25,
                    py: 0.25,
                    borderRadius: `${RADIUS.pill}px`,
                    border: '1px solid currentColor',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textDecoration: 'none',
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 160ms',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                  }}
                >
                  {announcement.ctaLabel}
                  <ChevronRightIcon sx={{ fontSize: 14 }} />
                </Box>
              )}
            </Stack>
          </Container>
        </Box>
      )}

      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          // Translucent with a backdrop blur once scrolled, so product imagery
          // reads through the header instead of being cut off by it.
          bgcolor: isScrolled ? 'rgba(255, 255, 255, 0.82)' : 'background.paper',
          backdropFilter: isScrolled ? 'saturate(180%) blur(16px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'saturate(180%) blur(16px)' : 'none',
          borderBottom: '1px solid',
          borderColor: isScrolled ? SURFACE.border : 'transparent',
          boxShadow: isScrolled ? SHADOW.xs : 'none',
        }}
      >
        <Container sx={{ maxWidth: `${SHELL_MAX_WIDTH}px !important` }}>
          <Toolbar
            disableGutters
            sx={{
              gap: { xs: 1, md: 2, lg: 3 },
              // Condensing on scroll returns vertical space to the content.
              // Animating `min-height` is a layout property, but it changes once
              // per scroll-state flip rather than per frame, so it is not on a
              // hot path.
              minHeight: {
                xs: 60,
                md: isScrolled ? HEADER_HEIGHT.scrolled : HEADER_HEIGHT.rest,
              },
              transition: 'min-height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/*
              The brand lockup. On desktop the mark sits alongside the
              wordmark; on phones the mark stands alone, because the full name
              at a legible size would leave no room for the menu and would push
              the search field off its own row. The link keeps the brand name as
              its accessible label either way, so nothing is lost when the words
              are not drawn.
            */}
            <Box
              component={NextLink}
              href="/"
              aria-label="Manisha Readymades — home"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                textDecoration: 'none',
                flexShrink: 0,
                mr: 'auto',
                '&:hover .brand-lockup__mark': { transform: 'rotate(-4deg) scale(1.04)' },
                '@media (prefers-reduced-motion: reduce)': {
                  '&:hover .brand-lockup__mark': { transform: 'none' },
                },
              }}
            >
              <Box
                className="brand-lockup__mark"
                sx={{
                  display: 'flex',
                  transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <BrandLogo size={isScrolled ? 32 : 36} />
              </Box>

              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography
                  component="span"
                  sx={{
                    display: 'block',
                    color: 'primary.main',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    fontSize: '1.25rem',
                  }}
                >
                  Manisha Readymades
                </Typography>
                <Typography
                  component="span"
                  variant="overline"
                  sx={{
                    display: 'block',
                    color: 'text.secondary',
                    fontSize: '0.5625rem',
                    letterSpacing: '0.18em',
                    lineHeight: 1.4,
                  }}
                >
                  Wholesale Garments
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <HeaderSearch />
            </Box>

            <Stack
              direction="row"
              spacing={{ md: 2, lg: 3 }}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  isActive={isActiveRoute(router.pathname, link.href)}
                />
              ))}
            </Stack>

            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<WhatsAppIcon />}
              href={buildGeneralEnquiryLink()}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0 }}
            >
              WhatsApp
            </Button>

            <IconButton
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>

          {/* On phones the search field gets its own row rather than being
              buried in the menu: it is the primary way a wholesale buyer looks
              for a specific SKU, and it should never be more than one tap away. */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, pb: 1.25 }}>
            <HeaderSearch fullWidth />
          </Box>
        </Container>

        {/* Inside the AppBar, so the categories stay reachable for the whole
            scroll rather than only at the top of the page. */}
        <CategoryStrip categories={categories} />
      </AppBar>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '86vw', sm: 340 }, maxWidth: 380 } }}
      >
        <Box
          sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: OUTER_SPACING }}
          role="presentation"
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <BrandLogo size={32} />
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: 'block',
                    color: 'primary.main',
                    fontWeight: 800,
                    fontSize: '0.9375rem',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  Manisha Readymades
                </Typography>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                  Wholesale Garments
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation menu" edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Menu entries arrive in sequence. The stagger is short enough that
              the list reads as one movement rather than four. */}
          <m.nav
            variants={prefersReducedMotion ? undefined : staggerContainer(0.05, 0.08)}
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
          >
            <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {NAV_LINKS.map((link) => {
                const isActive = isActiveRoute(router.pathname, link.href);
                return (
                  <m.li
                    key={link.href}
                    variants={
                      prefersReducedMotion
                        ? undefined
                        : {
                            hidden: { opacity: 0, x: 16 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: DURATION.base, ease: EASE.standard },
                            },
                          }
                    }
                  >
                    <Box
                      component={NextLink}
                      href={link.href}
                      onClick={() => setIsDrawerOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      sx={{
                        display: 'block',
                        // Comfortably above the 44px touch-target minimum.
                        py: 1.75,
                        px: 1,
                        mx: -1,
                        borderRadius: `${RADIUS.sm}px`,
                        fontSize: '1.125rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'primary.main' : 'text.primary',
                        textDecoration: 'none',
                        transition: 'background-color 160ms, color 160ms',
                        '&:active': { bgcolor: 'action.hover' },
                      }}
                    >
                      {link.label}
                    </Box>
                  </m.li>
                );
              })}
            </Stack>
          </m.nav>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Divider sx={{ mb: OUTER_SPACING }} />
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              href={buildGeneralEnquiryLink()}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Us
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>{children}</Box>

      <Box
        component="footer"
        sx={{
          bgcolor: SURFACE.inverse,
          color: 'common.white',
          pt: { xs: 6, md: 8 },
          pb: OUTER_SPACING,
          mt: 'auto',
        }}
      >
        <Container sx={{ maxWidth: `${SHELL_MAX_WIDTH}px !important` }}>
          <Box
            sx={{
              display: 'grid',
              // Stacked columns on mobile need a larger gap than side-by-side
              // ones on desktop, or the groups run together vertically.
              gap: { xs: 5, md: 4 },
              // The brand column is given twice the width of the link columns so
              // its paragraph sets at a readable measure instead of a narrow
              // ribbon of text.
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 1fr 1fr' },
            }}
          >
            <Box sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
                <BrandLogo size={34} inverse />
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Manisha Readymades
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.72, mt: 1.5, maxWidth: 340, lineHeight: 1.7 }}>
                Wholesale garment supplier since 2008. Bulk orders, custom printing and fast
                WhatsApp support.
              </Typography>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="overline" sx={{ opacity: 0.55 }}>
                Contact
              </Typography>
              {publicEnv.contactPhone && (
                <Link href={`tel:${publicEnv.contactPhone}`} color="inherit" sx={FOOTER_LINK_SX}>
                  {publicEnv.contactPhone}
                </Link>
              )}
              <Link
                href={buildGeneralEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                sx={FOOTER_LINK_SX}
              >
                WhatsApp
              </Link>
              {publicEnv.googleMapsUrl && (
                <Link
                  href={publicEnv.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  sx={FOOTER_LINK_SX}
                >
                  Find us on Google Maps
                </Link>
              )}
            </Stack>

            <Stack spacing={1.25}>
              <Typography variant="overline" sx={{ opacity: 0.55 }}>
                Explore
              </Typography>
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  component={NextLink}
                  href={link.href}
                  color="inherit"
                  sx={FOOTER_LINK_SX}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: OUTER_SPACING, borderColor: 'rgba(255,255,255,0.12)' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={INNER_SPACING}
          >
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              © {new Date().getFullYear()} Manisha Readymades. All rights reserved.
            </Typography>

            {/*
              Staff sign-in. It belongs in the footer's bottom bar rather than
              in Explore: shoppers have no use for it, and the bottom bar is
              where every site puts the links that exist for the people running
              it. `nofollow` keeps crawlers off a page that only rejects them —
              the login screen is already `noindex`.
            */}
            <Link
              component={NextLink}
              href="/admin/login"
              rel="nofollow"
              color="inherit"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                opacity: 0.55,
                textDecoration: 'none',
                transition: 'opacity 180ms',
                '&:hover': { opacity: 1 },
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 13 }} />
              Staff login
            </Link>
          </Stack>

          {mobileBottomInset > 0 && (
            <Box
              aria-hidden
              sx={{ display: { xs: 'block', md: 'none' }, height: `${mobileBottomInset}px` }}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}


/**
 * Footer link styling: dimmed at rest, brightening and stepping forward
 * slightly on hover.
 *
 * @remarks
 * Shared as a constant because four separate `sx` objects with the same
 * intention is exactly how a design system starts to drift.
 */
const FOOTER_LINK_SX = {
  opacity: 0.72,
  width: 'fit-content',
  textDecoration: 'none',
  transition: 'opacity 180ms, transform 180ms',
  '&:hover': { opacity: 1, transform: 'translateX(2px)' },
  '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
} as const;
