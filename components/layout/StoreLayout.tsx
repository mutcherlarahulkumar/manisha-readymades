/**
 * Storefront shell: promotional banner strip, navigation header, and footer.
 *
 * @module components/layout/StoreLayout
 */
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
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Head from 'next/head';
import NextLink from 'next/link';
import { useState, type ReactNode } from 'react';

import { publicEnv } from '@/lib/env';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { Banner } from '@/types/models';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/** Primary storefront navigation. */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/custom-printing', label: 'Custom Printing' },
  { href: '/contact', label: 'Contact' },
] as const;

/** Props for {@link StoreLayout}. */
interface StoreLayoutProps {
  children: ReactNode;
  /** Browser tab title; the brand name is appended automatically. */
  title?: string;
  /** Meta description for search engines. */
  description?: string;
  /** Banners with position `top`, rendered as the announcement strip. */
  topBanners?: Banner[];
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
}: StoreLayoutProps): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pageTitle = title ? `${title} · Manisha Readymades` : 'Manisha Readymades · Wholesale Garment Supplier';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
      </Head>

      {/* Announcement strip: admin-controlled, hidden entirely when empty. */}
      {topBanners.length > 0 && (
        <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', py: 1 }}>
          <Container>
            <Typography variant="body2" align="center" sx={{ fontWeight: 600 }}>
              {topBanners.map((banner) => banner.title).join('  •  ')}
            </Typography>
          </Container>
        </Box>
      )}

      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container>
          <Toolbar disableGutters sx={{ gap: INNER_SPACING }}>
            <Typography
              component={NextLink}
              href="/"
              variant="h5"
              sx={{ flexGrow: 1, color: 'primary.main', textDecoration: 'none', fontWeight: 700 }}
            >
              Manisha Readymades
            </Typography>

            <Stack direction="row" spacing={INNER_SPACING} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {NAV_LINKS.map((link) => (
                <Button key={link.href} component={NextLink} href={link.href} color="inherit">
                  {link.label}
                </Button>
              ))}
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                href={buildGeneralEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </Button>
            </Stack>

            <IconButton
              aria-label="Open navigation menu"
              onClick={() => setIsDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Box sx={{ width: 260, p: INNER_SPACING }} role="presentation" onClick={() => setIsDrawerOpen(false)}>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton key={link.href} component={NextLink} href={link.href}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: INNER_SPACING }} />
          <Button
            fullWidth
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
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>{children}</Box>

      <Box component="footer" sx={{ bgcolor: 'primary.dark', color: 'common.white', py: OUTER_SPACING, mt: 'auto' }}>
        <Container>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={OUTER_SPACING}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6">Manisha Readymades</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, maxWidth: 320 }}>
                Wholesale garment supplier since 2020. Bulk orders, custom printing and fast
                WhatsApp support.
              </Typography>
            </Box>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Contact</Typography>
              {publicEnv.contactPhone && (
                <Link href={`tel:${publicEnv.contactPhone}`} color="inherit" underline="hover">
                  {publicEnv.contactPhone}
                </Link>
              )}
              <Link
                href={buildGeneralEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
              >
                WhatsApp
              </Link>
              {publicEnv.googleMapsUrl && (
                <Link
                  href={publicEnv.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  underline="hover"
                >
                  Find us on Google Maps
                </Link>
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Explore</Typography>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  component={NextLink}
                  href={link.href}
                  color="inherit"
                  underline="hover"
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: OUTER_SPACING, borderColor: 'rgba(255,255,255,0.2)' }} />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} Manisha Readymades. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
