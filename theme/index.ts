/**
 * The application's MUI theme.
 *
 * Component defaults are set here rather than repeated at call sites, so the
 * spacing contract in `theme/spacing` and the "traditional form" look are
 * enforced globally: outlined inputs, top-aligned bold labels, and consistent
 * card and dialog padding.
 *
 * @module theme
 */
import { createTheme, type Theme } from '@mui/material/styles';

import { SPACING_PX, SPACING_UNIT } from '@/theme/spacing';

/** Brand palette: deep indigo for trust, warm amber for calls to action. */
const palette = {
  primary: { main: '#1F3A8A', light: '#4661B8', dark: '#12245C', contrastText: '#FFFFFF' },
  secondary: { main: '#D97706', light: '#F59E0B', dark: '#B45309', contrastText: '#FFFFFF' },
  success: { main: '#15803D' },
  warning: { main: '#B45309' },
  error: { main: '#B91C1C' },
  info: { main: '#0369A1' },
  background: { default: '#F6F7FB', paper: '#FFFFFF' },
  text: { primary: '#111827', secondary: '#4B5563' },
} as const;

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
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.125rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.background.default },
        // Long product and order tables must scroll inside their container
        // rather than making the page scroll sideways.
        '#__next': { overflowX: 'hidden' },
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
        root: { border: '1px solid #E5E7EB' },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 8 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { paddingBottom: SPACING_PX.inner.mobile } },
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
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiAutocomplete: {
      defaultProps: { size: 'small' },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 0, marginRight: 0 } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { paddingInline: SPACING_PX.inner.desktop } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { paddingInline: SPACING_PX.inner.desktop, paddingBlock: SPACING_PX.inner.mobile },
        head: { fontWeight: 700, backgroundColor: '#F3F4F6', whiteSpace: 'nowrap' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});
