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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import { INNER_SPACING } from '@/theme/spacing';
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
const SORT_OPTIONS = [
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
    <Paper variant="outlined" sx={{ p: INNER_SPACING }} component="aside" aria-label="Product filters">
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

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Categories
          </Typography>
          <Stack>
            {topLevel.map((parent) => {
              const children = categories.filter((child) => child.parent?._id === parent._id);
              return (
                <Box key={parent._id}>
                  <FormControlLabel
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
                    <Stack sx={{ pl: INNER_SPACING }}>
                      {children.map((child) => (
                        <FormControlLabel
                          key={child._id}
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
        </Box>

        {brands.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Brands
              </Typography>
              <Stack>
                {brands.map((brand) => (
                  <FormControlLabel
                    key={brand._id}
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
            </Box>
          </>
        )}

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Sizes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {SIZES.map((size) => (
              <FormControlLabel
                key={size}
                control={
                  <Checkbox
                    size="small"
                    checked={values.sizes.includes(size)}
                    onChange={() => onChange({ ...values, sizes: toggle(values.sizes, size) })}
                  />
                }
                label={<Typography variant="body2">{size}</Typography>}
                sx={{ mr: 1 }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Price range (₹)
          </Typography>
          <Stack direction="row" spacing={INNER_SPACING}>
            <TextField
              label="Min"
              type="number"
              value={values.minPrice}
              onChange={(event) => onChange({ ...values, minPrice: event.target.value })}
            />
            <TextField
              label="Max"
              type="number"
              value={values.maxPrice}
              onChange={(event) => onChange({ ...values, maxPrice: event.target.value })}
            />
          </Stack>
        </Box>

        <Button startIcon={<ClearIcon />} onClick={onReset} variant="outlined" fullWidth>
          Clear all filters
        </Button>
      </Stack>
    </Paper>
  );
}
