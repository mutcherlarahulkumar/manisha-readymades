/**
 * Banner management: what appears at the top of the storefront and in the hero.
 *
 * @module pages/admin/banners/index
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
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import {
  FormCheckboxField,
  FormDateField,
  FormSelectField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import { BANNER_POSITIONS, type Banner, type BannerPosition } from '@/types/models';
import { formatDate } from '@/utils/format';
import { bannerSchema, type BannerFormValues } from '@/validation/marketing.schema';

/** Where each position renders, explained for the admin. */
const POSITION_LABEL: Record<BannerPosition, string> = {
  top: 'Announcement strip — text at the very top',
  hero: 'Home page hero — large background image',
  promo: 'Promotional block',
};

/**
 * The banner management screen.
 *
 * @returns The page element.
 */
export default function AdminBannersPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<Banner[]>('/api/banners');
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const banners = data ?? [];

  const positionOptions = useMemo<SelectOption[]>(
    () => BANNER_POSITIONS.map((position) => ({ value: position, label: POSITION_LABEL[position] })),
    [],
  );

  /** A blank banner. The image is required, so it starts unset and is validated. */
  const blankBanner = useMemo(
    () =>
      ({
        title: '',
        subtitle: undefined,
        image: undefined,
        link: undefined,
        position: 'top',
        sortOrder: 0,
        startsAt: null,
        endsAt: null,
        isActive: true,
      }) as unknown as BannerFormValues,
    [],
  );

  async function handleSubmit(
    values: BannerFormValues,
    helpers: FormikHelpers<BannerFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/banners/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Banner updated');
      } else {
        await api('/api/banners', { method: 'POST', body: values });
        notifySuccess('Banner created');
      }
      setEditing(null);
      setIsCreating(false);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this banner.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/banners/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess('Banner deleted');
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this banner.');
    }
  }

  return (
    <AdminLayout
      title="Banners"
      subtitle="Control what visitors see at the top of the site"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
          New banner
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={banners.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No banners yet',
          description: 'Add an announcement strip or a hero image for the home page.',
          action: (
            <Button variant="contained" onClick={() => setIsCreating(true)}>
              Add banner
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell align="right">Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner._id} hover>
                  <TableCell>
                    <Box sx={{ width: 72, height: 40, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary asset. */}
                      <img
                        src={banner.image.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {banner.title}
                    </Typography>
                    {banner.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {banner.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{banner.position}</TableCell>
                  <TableCell>
                    {banner.startsAt || banner.endsAt
                      ? `${formatDate(banner.startsAt)} – ${formatDate(banner.endsAt)}`
                      : 'Always'}
                  </TableCell>
                  <TableCell align="right">{banner.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={banner.isActive ? 'Active' : 'Off'}
                      color={banner.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing(banner)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setPendingDelete(banner)}>
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
        <DialogTitle>{editing ? 'Edit banner' : 'New banner'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? ({
                    title: editing.title,
                    subtitle: editing.subtitle,
                    image: editing.image,
                    link: editing.link,
                    position: editing.position,
                    sortOrder: editing.sortOrder,
                    startsAt: editing.startsAt ? new Date(editing.startsAt) : null,
                    endsAt: editing.endsAt ? new Date(editing.endsAt) : null,
                    isActive: editing.isActive,
                  } as unknown as BannerFormValues)
                : blankBanner
            }
            validationSchema={bannerSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={INNER_SPACING}>
                  <FormTextField name="title" label="Title" required />
                  <FormTextField name="subtitle" label="Subtitle" />
                  <ImageUploader name="image" label="Banner image" folder="banners" single />
                  <FormTextField
                    name="link"
                    label="Link"
                    helperText="Optional. A full URL, or a path such as /products."
                  />
                  <FormSelectField name="position" label="Position" options={positionOptions} required />
                  <FormTextField
                    name="sortOrder"
                    label="Sort order"
                    type="number"
                    helperText="Lower numbers appear first."
                  />
                  <FormDateField
                    name="startsAt"
                    label="Show from"
                    clearable
                    helperText="Leave empty to show immediately."
                  />
                  <FormDateField
                    name="endsAt"
                    label="Show until"
                    clearable
                    helperText="Leave empty to show indefinitely."
                  />
                  <FormCheckboxField name="isActive" label="Active" />

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
        title="Delete banner?"
        message={`"${pendingDelete?.title ?? ''}" and its image will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
