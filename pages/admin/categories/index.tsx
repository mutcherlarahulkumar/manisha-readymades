/**
 * Category management: nested categories with case-insensitive unique names.
 *
 * Categories are edited in a dialog rather than on a separate page, since the
 * form is short and the list gives the context the admin needs.
 *
 * @module pages/admin/categories/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormCheckboxField, FormSelectField, FormTextField, type SelectOption } from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import type { CategoryWithParent } from '@/types/models';
import { categorySchema, type CategoryFormValues } from '@/validation/taxonomy.schema';

/** Values for a new category. */
const BLANK_CATEGORY: CategoryFormValues = {
  name: '',
  parent: null,
  description: undefined,
  image: null,
  sortOrder: 0,
  isActive: true,
};

/**
 * The category management screen.
 *
 * @returns The page element.
 */
export default function AdminCategoriesPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<CategoryWithParent[]>('/api/categories');
  const [editing, setEditing] = useState<CategoryWithParent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CategoryWithParent | null>(null);

  // Memoised so the parent-option list below is not rebuilt on every render.
  const categories = useMemo(() => data ?? [], [data]);

  // Only top-level categories may be parents: the tree is capped at two levels
  // so navigation stays predictable.
  const parentOptions = useMemo<SelectOption[]>(
    () =>
      categories
        .filter((category) => category.parent === null && category._id !== editing?._id)
        .map((category) => ({ value: category._id, label: category.name })),
    [categories, editing],
  );

  const isDialogOpen = isCreating || editing !== null;

  async function handleSubmit(
    values: CategoryFormValues,
    helpers: FormikHelpers<CategoryFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/categories/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Category updated');
      } else {
        await api('/api/categories', { method: 'POST', body: values });
        notifySuccess('Category created');
      }
      setEditing(null);
      setIsCreating(false);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this category.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/categories/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      // A 409 here means products or sub-categories still reference it.
      notifyError(deleteError, 'Could not delete this category.');
    }
  }

  return (
    <AdminLayout
      title="Categories"
      subtitle="Names are unique regardless of capitalisation"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
          New category
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={categories.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No categories yet',
          description: 'Create top-level categories such as Men’s Wear, then nest sub-categories inside them.',
          action: (
            <Button variant="contained" onClick={() => setIsCreating(true)}>
              Add category
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="right">Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: category.parent ? 400 : 600 }}>
                      {category.parent ? `— ${category.name}` : category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{category.parent?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {category.slug}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{category.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={category.isActive ? 'Active' : 'Hidden'}
                      color={category.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing(category)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setPendingDelete(category)}>
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
        open={isDialogOpen}
        onClose={() => {
          setEditing(null);
          setIsCreating(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? {
                    name: editing.name,
                    parent: editing.parent?._id ?? null,
                    description: editing.description,
                    image: editing.image ?? null,
                    sortOrder: editing.sortOrder,
                    isActive: editing.isActive,
                  }
                : BLANK_CATEGORY
            }
            validationSchema={categorySchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={INNER_SPACING}>
                  <FormTextField name="name" label="Category name" required />
                  <FormSelectField
                    name="parent"
                    label="Parent category"
                    options={parentOptions}
                    allowEmpty
                    emptyLabel="None — top level"
                    helperText="Categories can be nested one level deep."
                  />
                  <FormTextField name="description" label="Description" multiline rows={2} />
                  <FormTextField
                    name="sortOrder"
                    label="Sort order"
                    type="number"
                    helperText="Lower numbers appear first."
                  />
                  <ImageUploader name="image" label="Category image" folder="categories" single />
                  <FormCheckboxField name="isActive" label="Visible on the storefront" />

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
        title="Delete category?"
        message={`"${pendingDelete?.name ?? ''}" will be removed. Categories that still contain products or sub-categories cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
