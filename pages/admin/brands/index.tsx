/**
 * Brand management. Brand names are unique regardless of capitalisation.
 *
 * @module pages/admin/brands/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormCheckboxField, FormTextField } from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import type { Brand } from '@/types/models';
import { brandSchema, type BrandFormValues } from '@/validation/taxonomy.schema';

/** Values for a new brand. */
const BLANK_BRAND: BrandFormValues = { name: '', logo: null, isActive: true };

/**
 * The brand management screen.
 *
 * @returns The page element.
 */
export default function AdminBrandsPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<Brand[]>('/api/brands');
  const [editing, setEditing] = useState<Brand | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null);

  const brands = data ?? [];

  async function handleSubmit(
    values: BrandFormValues,
    helpers: FormikHelpers<BrandFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/brands/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Brand updated');
      } else {
        await api('/api/brands', { method: 'POST', body: values });
        notifySuccess('Brand created');
      }
      setEditing(null);
      setIsCreating(false);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this brand.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/brands/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this brand.');
    }
  }

  return (
    <AdminLayout
      title="Brands"
      subtitle="Optional on products, but useful for filtering"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
          New brand
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={brands.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No brands yet',
          description: 'Add brands if you stock labelled goods. Products can be saved without one.',
          action: (
            <Button variant="contained" onClick={() => setIsCreating(true)}>
              Add brand
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Logo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand._id} hover>
                  <TableCell>
                    <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100' }}>
                      {brand.logo && (
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset.
                        <img
                          src={brand.logo.url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {brand.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {brand.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={brand.isActive ? 'Active' : 'Hidden'}
                      color={brand.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing(brand)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setPendingDelete(brand)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AsyncState>

      <Dialog
        open={isCreating || editing !== null}
        onClose={() => {
          setEditing(null);
          setIsCreating(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? 'Edit brand' : 'New brand'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? { name: editing.name, logo: editing.logo ?? null, isActive: editing.isActive }
                : BLANK_BRAND
            }
            validationSchema={brandSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={INNER_SPACING}>
                  <FormTextField name="name" label="Brand name" required />
                  <ImageUploader name="logo" label="Logo" folder="brands" single />
                  <FormCheckboxField name="isActive" label="Available as a storefront filter" />

                  <Stack direction="row" spacing={INNER_SPACING} justifyContent="flex-end">
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setIsCreating(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete brand?"
        message={`"${pendingDelete?.name ?? ''}" will be removed. Brands still used by products cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
