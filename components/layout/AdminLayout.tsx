/**
 * Admin dashboard shell: persistent navigation, header, and the client-side
 * authentication guard.
 *
 * Because the bearer token lives in `localStorage`, the guard necessarily runs
 * in the browser. This protects the *interface* only — every endpoint behind it
 * independently verifies the token, so a bypassed guard reveals nothing.
 *
 * @module components/layout/AdminLayout
 */
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ImageIcon from '@mui/icons-material/Image';
import InventoryIcon from '@mui/icons-material/Inventory2';
import LabelIcon from '@mui/icons-material/LocalOffer';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import SellIcon from '@mui/icons-material/Sell';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';

import { LoadingState } from '@/components/common/StateViews';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { AdminRole } from '@/types/models';

/** Width of the persistent navigation drawer. */
const DRAWER_WIDTH = 248;

/** A single navigation entry. */
interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Restricts the entry to specific roles; omitted means every admin. */
  roles?: readonly AdminRole[];
}

/** Navigation grouped by the area of the business it belongs to. */
const NAV_GROUPS: ReadonlyArray<{ heading: string; items: readonly NavItem[] }> = [
  {
    heading: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
      { href: '/admin/analytics', label: 'Analytics', icon: <AssessmentIcon /> },
    ],
  },
  {
    heading: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: <InventoryIcon /> },
      { href: '/admin/categories', label: 'Categories', icon: <CategoryIcon /> },
      { href: '/admin/brands', label: 'Brands', icon: <SellIcon /> },
      { href: '/admin/reviews', label: 'Reviews', icon: <RateReviewIcon /> },
    ],
  },
  {
    heading: 'Storefront',
    items: [
      { href: '/admin/discounts', label: 'Discounts', icon: <LabelIcon /> },
      { href: '/admin/banners', label: 'Banners', icon: <ImageIcon /> },
    ],
  },
  {
    heading: 'Internal',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: <ReceiptIcon /> },
      { href: '/admin/staff', label: 'Staff', icon: <PeopleIcon />, roles: ['owner'] },
    ],
  },
];

/** Props for {@link AdminLayout}. */
interface AdminLayoutProps {
  children: ReactNode;
  /** Page heading, also used as the browser tab title. */
  title: string;
  /** Supporting line beneath the heading. */
  subtitle?: string;
  /** Actions rendered at the end of the header row. */
  action?: ReactNode;
}

/**
 * Wraps every admin page, redirecting to the login screen when signed out.
 *
 * @param props - Page content and header configuration.
 * @returns The dashboard shell, or a loading state while the session is checked.
 */
export function AdminLayout({ children, title, subtitle, action }: AdminLayoutProps): JSX.Element {
  const router = useRouter();
  const { admin, isLoading, isAuthenticated, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !admin) {
    // Centred in the viewport rather than pinned to the top of a blank page:
    // this is the whole screen while the session is verified, not a fragment
    // of one.
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <LoadingState label="Checking your session…" />
      </Box>
    );
  }

  const navigation = (
    <Box sx={{ py: 2, px: 1.5, height: '100%', bgcolor: 'background.paper' }}>
      <Box
        component={NextLink}
        href="/admin"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1,
          pb: 2,
          textDecoration: 'none',
        }}
      >
        <BrandLogo size={30} />
        <Typography
          component="span"
          sx={{
            color: 'primary.main',
            fontWeight: 800,
            fontSize: '1.0625rem',
            letterSpacing: '-0.02em',
          }}
        >
          Manisha Admin
        </Typography>
      </Box>
      <Divider sx={{ mx: -1.5 }} />

      {NAV_GROUPS.map((group) => {
        const visible = group.items.filter(
          (item) => !item.roles || item.roles.includes(admin.role),
        );
        if (visible.length === 0) return null;

        return (
          <List
            key={group.heading}
            dense
            disablePadding
            sx={{ mt: 2 }}
            subheader={
              <ListSubheader
                disableSticky
                disableGutters
                sx={{
                  px: 1,
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  lineHeight: 2.2,
                }}
              >
                {group.heading}
              </ListSubheader>
            }
          >
            {visible.map((item) => {
              // `/admin` must not stay highlighted on every sub-page.
              const isActive =
                item.href === '/admin'
                  ? router.pathname === '/admin'
                  : router.pathname.startsWith(item.href);

              return (
                <ListItemButton
                  key={item.href}
                  component={NextLink}
                  href={item.href}
                  selected={isActive}
                  onClick={() => setIsMobileNavOpen(false)}
                  sx={{
                    mb: 0.25,
                    py: 0.85,
                    // The active entry is a filled pill rather than a tinted
                    // row, so the current location is obvious at a glance in a
                    // list of twelve.
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': { color: 'inherit' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>{`${title} · Manisha Admin`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {navigation}
      </Drawer>

      <Drawer
        variant="temporary"
        open={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {navigation}
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'saturate(180%) blur(12px)',
            WebkitBackdropFilter: 'saturate(180%) blur(12px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ gap: INNER_SPACING, minHeight: { xs: 60, md: 68 } }}>
            <IconButton
              aria-label="Open navigation"
              onClick={() => setIsMobileNavOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h4" component="h1" noWrap>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {subtitle}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={INNER_SPACING} alignItems="center">
              {/*
                Page actions are scaled down on phones. A toolbar that already
                carries the menu button, the page title and the account block has
                no room for a full-height button, and at 375px the title was
                being squeezed to a couple of words.
              */}
              {action && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '& .MuiButton-root': {
                      minHeight: { xs: 34, md: 44 },
                      paddingInline: { xs: 1.25, md: 3 },
                      fontSize: { xs: '0.8125rem', md: '0.875rem' },
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: { xs: 0.5, md: 1 },
                      '& > *:nth-of-type(1)': { fontSize: { xs: 16, md: 20 } },
                    },
                  }}
                >
                  {action}
                </Box>
              )}
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {admin.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {admin.role === 'owner' ? 'Owner' : 'Staff'}
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton onClick={logout} aria-label="Sign out">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{ flexGrow: 1, p: OUTER_SPACING, bgcolor: 'background.default', minWidth: 0 }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
