/**
 * The application's MUI theme.
 *
 * Component defaults are set here rather than repeated at call sites, so the
 * spacing contract in `theme/spacing`, the radius and elevation tokens in
 * `theme/tokens`, and the "traditional form" look are enforced globally:
 * outlined inputs, top-aligned bold labels, and consistent card and dialog
 * padding.
 *
 * The type scale is fluid. Every display size interpolates with the viewport
 * through `clamp()` rather than switching at a breakpoint, which removes the
 * jump where a heading is briefly too large for the screen it is on.
 *
 * @module theme
 */
import { createTheme, type Theme } from '@mui/material/styles';

import { EASE } from '@/theme/motion';
import { SPACING_PX, SPACING_UNIT } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';

/**
 * Brand palette: deep indigo for trust, warm amber for calls to action.
 *
 * @remarks
 * The two brand hues are unchanged. What was added is a deliberate neutral
 * ramp: the page canvas is a cool off-white rather than pure white, so white
 * cards read as raised surfaces without needing heavy shadows to prove it.
 */
const palette = {
  primary: { main: '#1F3A8A', light: '#4661B8', dark: '#12245C', contrastText: '#FFFFFF' },
  secondary: { main: '#D97706', light: '#F59E0B', dark: '#B45309', contrastText: '#FFFFFF' },
  success: { main: '#15803D', light: '#22A155', dark: '#0F5C2C', contrastText: '#FFFFFF' },
  warning: { main: '#B45309' },
  error: { main: '#B91C1C' },
  info: { main: '#0369A1' },
  background: { default: SURFACE.canvas, paper: SURFACE.paper },
  text: { primary: '#111827', secondary: '#5A6474', disabled: '#9AA1AE' },
  divider: SURFACE.border,
  grey: {
    50: '#F9FAFB',
    100: SURFACE.subtle,
    200: SURFACE.border,
    300: SURFACE.borderStrong,
    400: '#9AA1AE',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

/** The font stack. Inter is loaded in `_document`; the rest are system fallbacks. */
const FONT_FAMILY = '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

/**
 * The shared theme instance.
 *
 * @remarks
 * `spacing` stays at MUI's 8px default so the tokens in `theme/spacing`
 * translate directly: `2` is 16px and `3` is 24px.
 */
export const theme: Theme = createTheme({
  spacing: SPACING_UNIT,
  palette,
  shape: { borderRadius: RADIUS.md },
  typography: {
    fontFamily: FONT_FAMILY,

    // Display sizes carry negative tracking. At large sizes the default spacing
    // between letters looks loose, and tightening it is most of what separates
    // an editorial headline from a default browser one.
    h1: {
      fontSize: 'clamp(2.125rem, 1.5rem + 2.8vw, 3.5rem)',
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontSize: 'clamp(1.75rem, 1.35rem + 1.7vw, 2.5rem)',
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: 'clamp(1.375rem, 1.2rem + 0.75vw, 1.75rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.015em' },
    h5: { fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
    h6: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.005em' },

    subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },

    // Body copy runs a little looser than MUI's default. Line height is the
    // cheapest readability win there is.
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },

    caption: { fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.01em' },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.005em' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          // Stops iOS Safari inflating type in landscape, which silently breaks
          // the fluid scale above.
          WebkitTextSizeAdjust: '100%',
          scrollBehavior: 'smooth',
        },
        body: {
          backgroundColor: palette.background.default,
          // Grayscale antialiasing keeps Inter's medium weights from looking
          // heavier than specified on macOS.
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },

        // Long product and order tables must scroll inside their container
        // rather than making the page scroll sideways.
        //
        // `clip` rather than `hidden`: `overflow-x: hidden` forces the computed
        // `overflow-y` to `auto`, which turns this element into a scroll
        // container — and a `position: sticky` descendant then anchors itself to
        // an element that never scrolls, so the sticky header silently stopped
        // sticking. `clip` truncates overflow without establishing a scroll
        // container, so sticky positioning keeps working.
        '#__next': { overflowX: 'clip' },

        // Images never break their column, whatever the intrinsic size of the
        // uploaded asset.
        'img, video': { maxWidth: '100%' },

        // A single, visible focus ring for keyboard users everywhere. Mouse
        // users never see it, so it costs the visual design nothing.
        ':focus-visible': {
          outline: `2px solid ${palette.primary.main}`,
          outlineOffset: 2,
          borderRadius: RADIUS.sm,
        },

        // Scroll-triggered reveals start at `opacity: 0` and are animated in by
        // an IntersectionObserver. Printing never scrolls, so any section below
        // the fold would otherwise come out of the printer blank. Forcing the
        // reveal wrappers to their final state for print costs nothing on
        // screen and makes a printed product page complete.
        '@media print': {
          '[data-reveal]': {
            opacity: '1 !important',
            transform: 'none !important',
            clipPath: 'none !important',
          },
        },

        // Anyone who has asked their operating system for less motion gets a
        // static interface: entrance animations resolve instantly instead of
        // being skipped, so nothing is left invisible.
        '@media (prefers-reduced-motion: reduce)': {
          html: { scrollBehavior: 'auto' },
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },

    MuiContainer: {
      defaultProps: { maxWidth: 'xl' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          paddingLeft: SPACING_PX.outer.mobile,
          paddingRight: SPACING_PX.outer.mobile,
          [t.breakpoints.up('md')]: {
            paddingLeft: SPACING_PX.outer.desktop,
            paddingRight: SPACING_PX.outer.desktop,
          },
        }),
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          padding: SPACING_PX.inner.mobile,
          [t.breakpoints.up('md')]: { padding: SPACING_PX.inner.desktop },
          '&:last-child': {
            paddingBottom: SPACING_PX.inner.mobile,
            [t.breakpoints.up('md')]: { paddingBottom: SPACING_PX.inner.desktop },
          },
        }),
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.md,
          border: `1px solid ${SURFACE.border}`,
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: RADIUS.md },
        outlined: { borderColor: SURFACE.border },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.lg,
          boxShadow: SHADOW.xl,
          // A full-screen dialog on a phone must not keep rounded corners:
          // they leave slivers of backdrop at the screen edge.
          '&.MuiDialog-paperFullScreen': { borderRadius: 0 },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(15, 27, 61, 0.5)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          paddingBottom: SPACING_PX.inner.mobile,
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.015em',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          padding: SPACING_PX.inner.mobile,
          [t.breakpoints.up('md')]: { padding: SPACING_PX.inner.desktop },
        }),
      },
    },

    // Traditional form styling: outlined fields, dense enough to scan, with
    // helper text reserved so the layout does not jump when an error appears.
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.sm,
          backgroundColor: SURFACE.paper,
          transition: `border-color 160ms, box-shadow 160ms`,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: SURFACE.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.grey[400] },
          // The focus ring is drawn as a soft halo rather than a thicker border,
          // so focusing a field does not shift the text inside it.
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: palette.primary.main,
          },
          '&.Mui-focused': { boxShadow: `0 0 0 3px rgba(31, 58, 138, 0.12)` },
        },
      },
    },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiAutocomplete: { defaultProps: { size: 'small' } },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 0, marginRight: 0 } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontWeight: 500 } },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.sm,
          // Buttons press in slightly and lift on hover. The travel is 1px:
          // enough for the hand to feel, too little for the eye to notice.
          transition: `background-color 160ms, border-color 160ms, color 160ms, transform 160ms, box-shadow 160ms`,
          '&:active': { transform: 'translateY(1px)' },
          // The trailing icon in a "View all →" style button drifts forward on
          // hover, pointing where the button leads.
          '& .MuiButton-endIcon': { transition: 'transform 200ms' },
          '&:hover .MuiButton-endIcon': { transform: 'translateX(3px)' },
          '@media (prefers-reduced-motion: reduce)': {
            '&:active': { transform: 'none' },
            '&:hover .MuiButton-endIcon': { transform: 'none' },
          },
        },
        // Comfortable, deliberately sized targets. The medium size clears the
        // 44px recommended minimum for touch on its own.
        sizeSmall: { minHeight: 36, paddingInline: 14, fontSize: '0.8125rem' },
        sizeMedium: { minHeight: 44, paddingInline: SPACING_PX.outer.desktop },
        sizeLarge: { minHeight: 52, paddingInline: 32, fontSize: '1rem' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: SHADOW.sm },
        },
        outlined: {
          borderColor: SURFACE.borderStrong,
          '&:hover': { borderColor: 'currentColor', backgroundColor: 'rgba(31, 58, 138, 0.04)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: 'background-color 160ms, color 160ms' },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: { transition: 'color 160ms, opacity 160ms' },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingInline: SPACING_PX.inner.desktop,
          paddingBlock: SPACING_PX.inner.mobile,
          borderColor: SURFACE.border,
        },
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: palette.text.secondary,
          backgroundColor: SURFACE.subtle,
          whiteSpace: 'nowrap',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: RADIUS.pill },
        outlined: { borderColor: SURFACE.borderStrong },
        sizeSmall: { fontSize: '0.6875rem', letterSpacing: '0.02em' },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.sm,
          transition: 'background-color 160ms, color 160ms',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none', borderColor: SURFACE.border },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: RADIUS.sm,
          backgroundColor: SURFACE.inverse,
          fontSize: '0.75rem',
          fontWeight: 500,
          paddingInline: 10,
          paddingBlock: 6,
        },
      },
    },

    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { backgroundColor: SURFACE.subtle, borderRadius: RADIUS.sm },
      },
    },

    MuiPaginationItem: {
      styleOverrides: {
        root: { borderRadius: RADIUS.sm, fontWeight: 600 },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: RADIUS.md },
        standardInfo: { backgroundColor: '#EEF3FB' },
      },
    },

    MuiRating: {
      styleOverrides: {
        root: { color: palette.secondary.main },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: SURFACE.border } },
    },

    MuiCardActionArea: {
      styleOverrides: {
        // MUI's default focus highlight is a translucent overlay that washes
        // out product photography. The global focus ring already covers this.
        focusHighlight: { opacity: '0 !important' },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: `background-color 280ms ${`cubic-bezier(${EASE.standard.join(',')})`}, box-shadow 280ms, border-color 280ms`,
        },
      },
    },
  },
});
