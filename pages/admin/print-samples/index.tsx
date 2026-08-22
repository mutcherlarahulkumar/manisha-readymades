/**
 * Custom printing samples.
 *
 * Photographs of work already done, shown on the public custom printing page.
 * The screen is a gallery rather than a table, because what an admin needs to
 * check here is whether the picture is the right one.
 *
 * @module pages/admin/print-samples/index
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormCheckboxField, FormTextField } from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { PrintSample } from '@/types/models';
import { printSampleSchema, type PrintSampleFormValues } from '@/validation/printSample.schema';

/** Values for a new sample. */
const BLANK: PrintSampleFormValues = {
  title: '',
  description: undefined,
  image: null as unknown as PrintSampleFormValues['image'],
  sortOrder: 0,
  isActive: true,
};

/**
 * The printing sample management screen.
 *
 * @returns The page element.
 */
export default function AdminPrintSamplesPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<PrintSample[]>('/api/print-samples');
  const [editing, setEditing] = useState<PrintSample | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PrintSample | null>(null);

  const samples = useMemo(() => data ?? [], [data]);
  const isDialogOpen = isCreating || editing !== null;

  function closeDialog(): void {
    setEditing(null);
    setIsCreating(false);
  }

  async function handleSubmit(
    values: PrintSampleFormValues,
    helpers: FormikHelpers<PrintSampleFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/print-samples/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Sample updated');
      } else {
        await api('/api/print-samples', { method: 'POST', body: values });
        notifySuccess('Sample added');
      }
      closeDialog();
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this sample.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/print-samples/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.title} removed`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not remove this sample.');
    }
  }

  return (
    <AdminLayout
      title="Printing samples"
      subtitle="Photos of custom work, shown on the Custom Printing page"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
          Add sample
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={samples.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No samples yet',
          description:
            'Add photos of t-shirts and uniforms you have printed. They appear on the Custom Printing page, above the quote form.',
          action: (
            <Button variant="contained" onClick={() => setIsCreating(true)}>
              Add the first sample
            </Button>
          ),
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: OUTER_SPACING,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {samples.map((sample) => (
            <Paper key={sample._id} variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ aspectRatio: '1 / 1', bgcolor: SURFACE.subtle }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                <img
                  src={sample.image.url}
                  alt={sample.image.alt ?? sample.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>

              <Box sx={{ p: INNER_SPACING }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0, wordBreak: 'break-word' }}
                  >
                    {sample.title}
                  </Typography>
                  {!sample.isActive && <Chip size="small" label="Hidden" />}
                </Stack>

                <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                    Order {sample.sortOrder}
                  </Typography>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => setEditing(sample)}
                      aria-label={`Edit ${sample.title}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setPendingDelete(sample)}
                      aria-label={`Delete ${sample.title}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      </AsyncState>

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit sample' : 'Add sample'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? {
                    title: editing.title,
                    description: editing.description,
                    image: editing.image,
                    sortOrder: editing.sortOrder,
                    isActive: editing.isActive,
                  }
                : BLANK
            }
            validationSchema={printSampleSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={OUTER_SPACING}>
                  <ImageUploader
                    name="image"
                    label="Photo"
                    folder="products"
                    single
                    helperText="A square photo works best — the gallery crops to a square."
                  />
                  <FormTextField
                    name="title"
                    label="Title"
                    required
                    helperText="What this is, e.g. “School uniform — St. Ann’s”."
                  />
                  <FormTextField
                    name="description"
                    label="Description"
                    multiline
                    rows={2}
                    helperText="Optional — fabric, print method, quantity."
                  />
                  <FormTextField
                    name="sortOrder"
                    label="Sort order"
                    type="number"
                    helperText="Lower numbers appear first."
                  />
                  <FormCheckboxField name="isActive" label="Visible on the storefront" />

                  <Stack direction="row" spacing={INNER_SPACING} justifyContent="flex-end">
                    <Button onClick={closeDialog} disabled={isSubmitting}>
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
        title="Remove this sample?"
        message={`"${pendingDelete?.title ?? ''}" and its photo will be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
