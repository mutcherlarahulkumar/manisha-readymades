/**
 * Storefront product filters.
 *
 * Filter state lives in the URL query string rather than component state, so a
 * filtered view can be shared, bookmarked and restored by the browser's back
 * button.
 *
 * @module components/product/ProductFilters
 */
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import { SIZES, type Brand, type CategoryWithParent } from '@/types/models';

/** The filter values a visitor can set. */
export interface ProductFilterValues {
  search: string;
  categories: string[];
  brands: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  sort: string;
}

/** Sort options offered to visitors. */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
] as const;

/** Props for {@link ProductFilters}. */
interface ProductFiltersProps {
  values: ProductFilterValues;
  categories: readonly CategoryWithParent[];
  brands: readonly Brand[];
  /** Called with the next filter state whenever the visitor changes something. */
  onChange: (values: ProductFilterValues) => void;
  /** Resets every filter to its default. */
  onReset: () => void;
}

/**
 * Toggles a value's presence in a list.
 *
 * @param list - The current selections.
 * @param value - The value to add or remove.
 * @returns A new list with the value toggled.
 */
function toggle(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Props for {@link FilterGroup}. */
interface FilterGroupProps {
  label: string;
  children: React.ReactNode;
}

/**
 * A labelled block within the filter panel.
 *
 * @param props - Group heading and controls.
 * @returns The group element.
 */
function FilterGroup({ label, children }: FilterGroupProps): JSX.Element {
  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Typography component="legend" variant="overline" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/** Shared styling for the compact checkbox rows used by categories and brands. */
const CHECKBOX_ROW_SX = {
  ml: -1,
  mr: 0,
  borderRadius: `${RADIUS.sm}px`,
  transition: 'background-color 150ms',
  '&:hover': { bgcolor: 'action.hover' },
  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
} as const;

/**
 * The filter sidebar: search, categories, brands, sizes, price and sort.
 *
 * @param props - Current values, available options and change handlers.
 * @returns The filter panel element.
 */
export function ProductFilters({
  values,
  categories,
  brands,
  onChange,
  onReset,
}: ProductFiltersProps): JSX.Element {
  // The search box is debounced locally so each keystroke does not trigger a
  // request or a history entry.
  const [searchDraft, setSearchDraft] = useState(values.search);

  useEffect(() => {
    setSearchDraft(values.search);
  }, [values.search]);

  useEffect(() => {
    if (searchDraft === values.search) return;
    const timer = window.setTimeout(() => onChange({ ...values, search: searchDraft }), 400);
    return () => window.clearTimeout(timer);
  }, [searchDraft, values, onChange]);

  const topLevel = categories.filter((category) => category.parent === null);

  return (
    <Box
      component="aside"
      aria-label="Product filters"
      sx={{
        p: { xs: 2, md: 2.5 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${RADIUS.md}px`,
      }}
    >
      <Stack spacing={2.5} divider={<Divider flexItem />}>
        <Stack spacing={INNER_SPACING}>
          <TextField
            label="Search"
            placeholder="Name or SKU"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            label="Sort by"
            value={values.sort}
            onChange={(event) => onChange({ ...values, sort: event.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <FilterGroup label="Categories">
          <Stack>
            {topLevel.map((parent) => {
              const children = categories.filter((child) => child.parent?._id === parent._id);
              return (
                <Box key={parent._id}>
                  <FormControlLabel
                    sx={CHECKBOX_ROW_SX}
                    control={
                      <Checkbox
                        size="small"
                        checked={values.categories.includes(parent.slug)}
                        onChange={() =>
                          onChange({ ...values, categories: toggle(values.categories, parent.slug) })
                        }
                      />
                    }
                    label={parent.name}
                  />
                  {children.length > 0 && (
                    // Sub-categories are indented against a hairline, so the
                    // hierarchy is visible without a second heading level.
                    <Stack
                      sx={{ pl: 2, ml: 1.25, borderLeft: '1px solid', borderColor: 'divider' }}
                    >
                      {children.map((child) => (
                        <FormControlLabel
                          key={child._id}
                          sx={CHECKBOX_ROW_SX}
                          control={
                            <Checkbox
                              size="small"
                              checked={values.categories.includes(child.slug)}
                              onChange={() =>
                                onChange({
                                  ...values,
                                  categories: toggle(values.categories, child.slug),
                                })
                              }
                            />
                          }
                          label={
                            <Typography variant="body2" color="text.secondary">
                              {child.name}
                            </Typography>
                          }
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </FilterGroup>

        {brands.length > 0 && (
          <FilterGroup label="Brands">
            <Stack>
              {brands.map((brand) => (
                <FormControlLabel
                  key={brand._id}
                  sx={CHECKBOX_ROW_SX}
                  control={
                    <Checkbox
                      size="small"
                      checked={values.brands.includes(brand.slug)}
                      onChange={() =>
                        onChange({ ...values, brands: toggle(values.brands, brand.slug) })
                      }
                    />
                  }
                  label={brand.name}
                />
              ))}
            </Stack>
          </FilterGroup>
        )}

        {/*
          Sizes are toggle buttons rather than a column of checkboxes. They are
          short, uniform labels chosen by tapping, and a row of chips shows the
          whole set at a glance in a fraction of the vertical space — the same
          control every clothing marketplace uses, for the same reason.
        */}
        <FilterGroup label="Sizes">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {SIZES.map((size) => {
              const isSelected = values.sizes.includes(size);
              return (
                <Box
                  key={size}
                  component="button"
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ ...values, sizes: toggle(values.sizes, size) })}
                  sx={{
                    minWidth: 44,
                    minHeight: 36,
                    px: 1.25,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: `${RADIUS.sm}px`,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : SURFACE.borderStrong,
                    bgcolor: isSelected ? 'primary.main' : 'background.paper',
                    color: isSelected ? 'primary.contrastText' : 'text.primary',
                    transition: 'background-color 160ms, border-color 160ms, color 160ms',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  {size}
                </Box>
              );
            })}
          </Box>
        </FilterGroup>

        <FilterGroup label="Price range (₹)">
          <Stack direction="row" spacing={INNER_SPACING}>
            <TextField
              label="Min"
              type="number"
              inputProps={{ min: 0, inputMode: 'numeric' }}
              value={values.minPrice}
              onChange={(event) => onChange({ ...values, minPrice: event.target.value })}
            />
            <TextField
              label="Max"
              type="number"
              inputProps={{ min: 0, inputMode: 'numeric' }}
              value={values.maxPrice}
              onChange={(event) => onChange({ ...values, maxPrice: event.target.value })}
            />
          </Stack>
        </FilterGroup>

        <Button startIcon={<ClearIcon />} onClick={onReset} variant="outlined" fullWidth>
          Clear all filters
        </Button>
      </Stack>
    </Box>
  );
}
