/**
 * Admin product list: search, status filter, and row actions.
 *
 * @module pages/admin/products/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { ProductListItem } from '@/types/models';
import { formatCurrency, PRODUCT_STATUS_LABEL } from '@/utils/format';

/** Rows shown per page in the admin table. */
const PAGE_SIZE = 20;

/**
 * The product management screen.
 *
 * @returns The page element.
 */
export default function AdminProductsPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ProductListItem | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  const key = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status) params.set('status', status);
    return `/api/products?${params.toString()}`;
  }, [debouncedSearch, status, page]);

  const { data, isLoading, error, refresh } = useResource<ProductListItem[]>(key);
  const products = data ?? [];

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/products/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this product.');
    }
  }

  return (
    <AdminLayout
      title="Products"
      subtitle="Add, edit and publish the catalogue"
      action={
        <Button component={NextLink} href="/admin/products/new" variant="contained" startIcon={<AddIcon />}>
          New product
        </Button>
      }
    >
      <Paper variant="outlined" sx={{ p: INNER_SPACING, mb: OUTER_SPACING }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={INNER_SPACING}>
          <TextField
            label="Search"
            placeholder="Name or SKU"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
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
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={products.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No products yet',
          description: 'Add your first product to start building the catalogue.',
          action: (
            <Button component={NextLink} href="/admin/products/new" variant="contained">
              Add product
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                      }}
                    >
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                        <img
                          src={product.images[0].url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {product.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                    {product.isFeatured && <Chip size="small" label="Featured" color="secondary" sx={{ mt: 0.5 }} />}
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{product.brand?.name ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(product.pricing.finalPrice)}</Typography>
                    {product.pricing.discountAmount > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatCurrency(product.pricing.basePrice)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={PRODUCT_STATUS_LABEL[product.status]}
                      color={product.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton component={NextLink} href={`/admin/products/${product._id}`} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setPendingDelete(product)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {products.length === PAGE_SIZE && (
          <Stack alignItems="center" sx={{ mt: OUTER_SPACING }}>
            <Pagination
              count={page + 1}
              page={page}
              color="primary"
              onChange={(_event, next) => setPage(next)}
            />
          </Stack>
        )}
      </AsyncState>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete product?"
        message={`"${pendingDelete?.name ?? ''}" and its reviews and images will be permanently removed. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
