/**
 * Wholesale catalogue management.
 *
 * One file, replaced whenever the range changes. Deliberately its own screen
 * rather than a field buried in settings: it is the single asset a retailer is
 * most likely to ask for, and keeping it stale is the failure mode worth
 * designing against.
 *
 * @module pages/admin/catalogue/index
 */
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormTextField } from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { Catalogue } from '@/types/models';
import { catalogueSchema, type CatalogueFormValues } from '@/validation/catalogue.schema';

/**
 * Size ceiling for the catalogue, in bytes.
 *
 * @remarks
 * Far above the 8 MB used for product photographs: a printed-quality range
 * catalogue routinely runs past that. The file goes straight from the browser
 * to Cloudinary, so the serverless body limit is not involved — but Cloudinary's
 * own per-plan ceiling still applies, and a rejection surfaces as an upload
 * error rather than being caught here.
 */
const MAX_CATALOGUE_BYTES = 25 * 1024 * 1024;

/**
 * The catalogue management screen.
 *
 * @returns The page element.
 */
export default function AdminCataloguePage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<Catalogue | null>('/api/catalogue');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const catalogue = data ?? null;

  const initialValues = useMemo<CatalogueFormValues>(
    () => ({
      file: catalogue?.file ?? (null as unknown as CatalogueFormValues['file']),
      label: catalogue?.label,
    }),
    [catalogue],
  );

  async function handleSubmit(
    values: CatalogueFormValues,
    helpers: FormikHelpers<CatalogueFormValues>,
  ): Promise<void> {
    try {
      await api('/api/catalogue', { method: 'PUT', body: values });
      notifySuccess('Catalogue updated');
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save the catalogue.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    try {
      await api('/api/catalogue', { method: 'DELETE' });
      notifySuccess('Catalogue removed');
      setIsConfirmingDelete(false);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not remove the catalogue.');
    }
  }

  return (
    <AdminLayout
      title="Catalogue"
      subtitle="The PDF retailers download from the storefront"
    >
      {/* Never "empty": having no catalogue yet is a state this screen has to
          render and explain, not one to replace with a placeholder. */}
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={false}
        onRetry={() => void refresh()}
      >
        <Stack spacing={OUTER_SPACING}>
          {catalogue ? (
            <Paper variant="outlined" sx={{ p: OUTER_SPACING }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={INNER_SPACING}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Live on the storefront
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {catalogue.label ?? 'No label set'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={INNER_SPACING} sx={{ flexShrink: 0 }}>
                  <Button
                    href={catalogue.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewIcon />}
                  >
                    View
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Box
              sx={{
                p: OUTER_SPACING,
                borderRadius: `${RADIUS.md}px`,
                bgcolor: SURFACE.subtle,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No catalogue uploaded yet. Until one is, the download button does not appear
                anywhere on the storefront.
              </Typography>
            </Box>
          )}

          <Paper variant="outlined" sx={{ p: OUTER_SPACING }}>
            <Formik
              initialValues={initialValues}
              validationSchema={catalogueSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <Stack spacing={OUTER_SPACING}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {catalogue ? 'Replace the catalogue' : 'Upload the catalogue'}
                    </Typography>

                    <ImageUploader
                      name="file"
                      label="Catalogue file"
                      folder="catalogue"
                      single
                      allowDocuments
                      maxBytes={MAX_CATALOGUE_BYTES}
                      helperText="A PDF is what retailers expect. Replacing this removes the old file."
                    />

                    <FormTextField
                      name="label"
                      label="Label"
                      helperText="Optional — shown beside the button, e.g. “Autumn 2026 range”."
                    />

                    <Stack direction="row" justifyContent="flex-end">
                      <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save'}
                      </Button>
                    </Stack>
                  </Stack>
                </Form>
              )}
            </Formik>
          </Paper>
        </Stack>
      </AsyncState>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Remove the catalogue?"
        message="The download button will disappear from the storefront and the file will be deleted."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </AdminLayout>
  );
}
