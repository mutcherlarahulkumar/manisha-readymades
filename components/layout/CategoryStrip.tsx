/**
 * The category navigation strip that sits directly beneath the header.
 *
 * @module components/layout/CategoryStrip
 */
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';

import { RADIUS, SHADOW, SHELL_MAX_WIDTH, SURFACE } from '@/theme/tokens';
import type { CategoryWithParent } from '@/types/models';

/**
 * Grace period before a flyout closes, in milliseconds.
 *
 * @remarks
 * The pointer has to cross a gap between the strip and the panel below it.
 * Closing on `mouseleave` alone would shut the menu mid-journey, so the close
 * is scheduled and cancelled if the pointer arrives.
 */
const CLOSE_DELAY_MS = 140;

/**
 * How many categories the strip lists before deferring to `/categories`.
 *
 * @remarks
 * Ten fills a desktop row without crowding the "View all" link, and keeps the
 * mobile row to a swipe or two rather than an unbounded scroll.
 */
const MAX_INLINE_CATEGORIES = 10;

/** Props for {@link CategoryStrip}. */
interface CategoryStripProps {
  /** Every category; only top-level entries are shown. */
  categories: readonly CategoryWithParent[];
}

/**
 * A horizontal row of top-level category links.
 *
 * @param props - The categories to list.
 * @returns The strip, or `null` when there are no categories to show.
 *
 * @remarks
 * The pattern every large marketplace uses: the catalogue's top level is
 * permanent navigation rather than a destination you have to scroll the home
 * page to reach. Each entry links to the catalogue filtered by that category —
 * the same `/products?categories=` URL the filter sidebar writes — so this adds
 * reach, not a second filtering mechanism.
 *
 * On narrow screens the row scrolls horizontally instead of wrapping. Wrapping
 * would make the header's height depend on how many categories the admin has
 * created, which would push the page content down by an unpredictable amount.
 */
export function CategoryStrip({ categories }: CategoryStripProps): JSX.Element | null {
  const router = useRouter();
  const theme = useTheme();
  // Hover menus belong to pointers. On touch the same gesture is a tap, which
  // must follow the link rather than open a panel over it — the drawer carries
  // the full tree there instead.
  const hasPointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const canFlyout = hasPointer && isDesktop;

  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback((): void => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const closeNow = useCallback((): void => {
    cancelClose();
    setOpenSlug(null);
    setAnchor(null);
  }, [cancelClose]);

  const scheduleClose = useCallback((): void => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenSlug(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const open = useCallback(
    (slug: string, element: HTMLElement): void => {
      cancelClose();
      setOpenSlug(slug);
      setAnchor(element);
    },
    [cancelClose],
  );

  // A menu left open across a navigation would hang over the new page.
  useEffect(() => {
    router.events.on('routeChangeStart', closeNow);
    return () => router.events.off('routeChangeStart', closeNow);
  }, [router.events, closeNow]);

  /*
   * Escape dismisses the menu.
   *
   * Bound to the document rather than to the strip, because a menu opened by
   * hovering leaves focus wherever it was — usually on the body. A handler on
   * the strip only ever sees the key when the menu was opened by tabbing to it,
   * which is the one case that needed it least.
   */
  useEffect(() => {
    if (openSlug === null) return undefined;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') closeNow();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSlug, closeNow]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const topLevel = categories.filter((category) => category.parent === null);

  if (topLevel.length === 0) return null;

  const activeSlugs =
    typeof router.query.categories === 'string' ? router.query.categories.split(',') : [];
  const isAllActive = router.pathname === '/products' && activeSlugs.length === 0;

  // Beyond this many, the strip stops listing and defers to the directory page.
  // A row long enough to need serious horizontal scrolling stops working as
  // navigation: the entries past the fold are invisible and unguessable, and a
  // "View all" link reaches them in one tap instead.
  const visible = topLevel.slice(0, MAX_INLINE_CATEGORIES);
  const hasOverflow = topLevel.length > MAX_INLINE_CATEGORIES;

  return (
    <Box
      component="nav"
      aria-label="Product categories"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <Container sx={{ maxWidth: `${SHELL_MAX_WIDTH}px !important` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflowX: 'auto',
            // The row is a scroll container on touch, but it should never look
            // like one: the scrollbar is suppressed and the overflow is
            // discovered by swiping, as on every marketplace.
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            // Cancels the container gutter so the first item aligns with the
            // logo above it, while still letting the row scroll edge to edge.
            mx: { xs: -1, md: -1.5 },
            px: { xs: 1, md: 1.5 },
            py: 0.75,
          }}
        >
          <CategoryLink href="/products" label="All Products" isActive={isAllActive} />
          {visible.map((category) => {
            const children = categories.filter((entry) => entry.parent?._id === category._id);
            const hasChildren = children.length > 0;
            const isOpen = openSlug === category.slug;

            return (
              <Box
                key={category._id}
                sx={{ display: 'flex', flexShrink: 0 }}
                onMouseEnter={
                  canFlyout && hasChildren
                    ? (event) => open(category.slug, event.currentTarget)
                    : undefined
                }
                onMouseLeave={canFlyout && hasChildren ? scheduleClose : undefined}
              >
                <CategoryLink
                  href={`/products?categories=${category.slug}`}
                  label={category.name}
                  isActive={activeSlugs.includes(category.slug)}
                  hasChildren={hasChildren && canFlyout}
                  isOpen={isOpen}
                  // Keyboard users get the same menu: focusing the parent
                  // reveals its children, and Escape dismisses without
                  // navigating away.
                  onFocus={
                    canFlyout && hasChildren
                      ? (event) => open(category.slug, event.currentTarget.parentElement ?? event.currentTarget)
                      : undefined
                  }
                />
              </Box>
            );
          })}

          {/* Shown only once the list is actually truncated. Offering "View
              all" beside a row that already shows everything would be a link
              to nothing new. */}
          {hasOverflow && (
            <Box
              component={NextLink}
              href="/categories"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                flexShrink: 0,
                ml: 0.5,
                px: 1.5,
                py: 0.75,
                borderRadius: `${RADIUS.sm}px`,
                fontSize: '0.8125rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: 'primary.main',
                transition: 'background-color 160ms',
                '&:hover': { bgcolor: SURFACE.subtle },
                '&:hover .category-strip__arrow': { transform: 'translateX(2px)' },
                '@media (prefers-reduced-motion: reduce)': {
                  '&:hover .category-strip__arrow': { transform: 'none' },
                },
              }}
            >
              View all
              <ChevronRightIcon
                className="category-strip__arrow"
                sx={{ fontSize: 16, transition: 'transform 200ms' }}
              />
            </Box>
          )}
        </Box>
      </Container>

      {/*
        Portalled rather than nested. The row above is a horizontal scroll
        container on touch, and an absolutely positioned panel inside one is
        clipped by it — the menu would be cut off instead of overhanging the
        page as it must.
      */}
      <Popper
        open={openSlug !== null && anchor !== null}
        anchorEl={anchor}
        placement="bottom-start"
        // Above the sticky header's own stacking context, below any dialog.
        sx={{ zIndex: (t) => t.zIndex.appBar + 1 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
      >
        <Paper
          elevation={0}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          sx={{
            minWidth: 220,
            maxWidth: 320,
            py: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${RADIUS.md}px`,
            boxShadow: SHADOW.lg,
          }}
        >
          {categories
            .filter((entry) => entry.parent?.slug === openSlug)
            .map((child) => (
              <Box
                key={child._id}
                component={NextLink}
                href={`/products?categories=${child.slug}`}
                onClick={closeNow}
                sx={{
                  display: 'block',
                  px: 2,
                  py: 1,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  textDecoration: 'none',
                  transition: 'background-color 140ms, color 140ms',
                  '&:hover': { bgcolor: SURFACE.subtle, color: 'primary.main' },
                  '&:focus-visible': { bgcolor: SURFACE.subtle, color: 'primary.main' },
                }}
              >
                {child.name}
              </Box>
            ))}
        </Paper>
      </Popper>
    </Box>
  );
}

/** Props for {@link CategoryLink}. */
interface CategoryLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  /** Draws the disclosure chevron and announces the submenu. */
  hasChildren?: boolean;
  /** Whether this entry's submenu is currently showing. */
  isOpen?: boolean;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
}

/**
 * A single entry in the strip.
 *
 * @param props - Target, label, active state and submenu state.
 * @returns The link element.
 *
 * @remarks
 * Remains a link even when it owns a submenu: a main category is a real
 * destination — every product filed anywhere beneath it — so both clicking it
 * and picking one of its children have to work.
 */
function CategoryLink({
  href,
  label,
  isActive,
  hasChildren = false,
  isOpen = false,
  onFocus,
}: CategoryLinkProps): JSX.Element {
  return (
    <Box
      component={NextLink}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      {...(hasChildren ? { 'aria-haspopup': true, 'aria-expanded': isOpen } : {})}
      onFocus={onFocus}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        flexShrink: 0,
        px: 1.5,
        py: 0.75,
        borderRadius: `${RADIUS.sm}px`,
        fontSize: '0.8125rem',
        fontWeight: isActive ? 700 : 500,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? SURFACE.subtle : 'transparent',
        transition: 'background-color 160ms, color 160ms',
        '&:hover': { bgcolor: SURFACE.subtle, color: 'primary.main' },
      }}
    >
      {label}
      {hasChildren && (
        <ExpandMoreIcon
          aria-hidden
          sx={{
            fontSize: 15,
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 180ms',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      )}
    </Box>
  );
}
