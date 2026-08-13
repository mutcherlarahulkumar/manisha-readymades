/**
 * The storefront's header search field.
 *
 * @module components/layout/HeaderSearch
 */
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';

import { RADIUS, SURFACE } from '@/theme/tokens';

/** Props for {@link HeaderSearch}. */
interface HeaderSearchProps {
  /** Called after a successful submit, so a containing drawer can close. */
  onSubmitted?: () => void;
  /** Renders the field at full width, for the mobile navigation panel. */
  fullWidth?: boolean;
}

/**
 * A search field that submits into the existing catalogue query.
 *
 * @remarks
 * This adds no search capability — it routes to `/products?search=`, the same
 * URL the catalogue's filter sidebar already writes, and the same server-side
 * query handles it. What it adds is reach: the catalogue's search was
 * previously only discoverable after navigating to `/products` and, on mobile,
 * after opening the filter drawer.
 *
 * Submitting deliberately drops any other active filters. A visitor typing a
 * new search term is starting a new search, and silently intersecting it with
 * a brand or price filter they set several screens ago is the kind of
 * "helpful" behaviour that produces an inexplicable empty result set.
 *
 * @param props - Submit callback and layout options.
 * @returns The search field.
 */
export function HeaderSearch({ onSubmitted, fullWidth = false }: HeaderSearchProps): JSX.Element {
  const router = useRouter();
  const [term, setTerm] = useState('');

  // Keep the field showing the term that produced the current results, so it
  // reads as the state of the page rather than as an empty box.
  useEffect(() => {
    const active = router.query.search;
    setTerm(typeof active === 'string' ? active : '');
  }, [router.query.search]);

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const trimmed = term.trim();
    void router.push(
      { pathname: '/products', query: trimmed ? { search: trimmed } : {} },
      undefined,
      { scroll: true },
    );
    onSubmitted?.();
  }

  return (
    <Box
      component="form"
      role="search"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: fullWidth ? '100%' : { md: 260, lg: 360 },
        pl: 1.5,
        pr: 0.5,
        py: 0.25,
        bgcolor: SURFACE.subtle,
        border: '1px solid transparent',
        borderRadius: `${RADIUS.pill}px`,
        transition: 'border-color 180ms, background-color 180ms, box-shadow 180ms',
        '&:hover': { borderColor: SURFACE.borderStrong },
        // The whole pill takes on the focus treatment when the input inside it
        // is focused, so the target the user is typing into is the thing that
        // looks focused.
        '&:focus-within': {
          bgcolor: 'background.paper',
          borderColor: 'primary.main',
          boxShadow: '0 0 0 3px rgba(31, 58, 138, 0.12)',
        },
      }}
    >
      <SearchIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
      <InputBase
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search products or SKU"
        inputProps={{ 'aria-label': 'Search products' }}
        sx={{ flexGrow: 1, minWidth: 0, fontSize: '0.875rem', '& input::placeholder': { opacity: 0.7 } }}
      />
      <IconButton
        type="submit"
        size="small"
        aria-label="Search"
        sx={{
          flexShrink: 0,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <SearchIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
