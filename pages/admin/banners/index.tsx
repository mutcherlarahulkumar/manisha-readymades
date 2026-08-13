/**
 * Banner management.
 *
 * The storefront has exactly two banner slots, so this screen presents exactly
 * two editors rather than a list of records with a position dropdown. The old
 * arrangement let several banners claim the same position while only one of
 * them rendered, and offered a third position that rendered nowhere at all.
 *
 * @module pages/admin/banners/index
 */
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useState, type ReactNode } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormCheckboxField, FormDateField, FormTextField } from '@/components/form/fields';
import { FormRow } from '@/components/form/FormLayout';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { Banner, BannerPosition } from '@/types/models';
import { bannerSchema, type BannerFormValues } from '@/validation/marketing.schema';

/** How each slot is introduced to the admin. */
const SLOTS: ReadonlyArray<{
  position: BannerPosition;
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    position: 'top',
    title: 'Announcement bar',
    description:
      'A single line across the very top of every page. Text only — add a button if it should lead somewhere.',
    icon: <CampaignIcon />,
  },
  {
    position: 'hero',
    title: 'Home page hero',
    description:
      'The large panel at the top of the home page. The image sits beside the headline; without one, the newest featured product stands in.',
    icon: <ImageIcon />,
  },
];

/**
 * Builds the form's starting values for a slot.
 *
 * @param position - Which slot is being edited.
 * @param banner - The banner currently in that slot, if any.
 * @returns Values for Formik.
 */
function initialValues(position: BannerPosition, banner: Banner | undefined): BannerFormValues {
  return {
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? undefined,
    image: banner?.image ?? null,
    link: banner?.link ?? undefined,
    ctaLabel: banner?.ctaLabel ?? undefined,
    position,
    startsAt: banner?.startsAt ? new Date(banner.startsAt) : null,
    endsAt: banner?.endsAt ? new Date(banner.endsAt) : null,
    isActive: banner?.isActive ?? true,
  } as unknown as BannerFormValues;
}

/**
 * The banner management screen.
 *
 * @returns The page element.
 */
export default function AdminBannersPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<Banner[]>('/api/banners');
  const [pendingClear, setPendingClear] = useState<Banner | null>(null);

  const banners = data ?? [];

  async function handleSubmit(
    values: BannerFormValues,
    helpers: FormikHelpers<BannerFormValues>,
  ): Promise<void> {
    try {
      // One endpoint for both slots: posting a position replaces whatever is
      // in it, so there is no create/update distinction to get wrong.
      await api('/api/banners', { method: 'POST', body: values });
      notifySuccess('Saved');
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this banner.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleClear(): Promise<void> {
    if (!pendingClear) return;
    try {
      await api(`/api/banners/${pendingClear._id}`, { method: 'DELETE' });
      notifySuccess('Removed');
      setPendingClear(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not remove this banner.');
    }
  }

  return (
    <AdminLayout title="Banners" subtitle="The two slots visitors see on the storefront">
      <AsyncState isLoading={isLoading} error={error} isEmpty={false} onRetry={refresh}>
        <Stack spacing={3} sx={{ maxWidth: 780 }}>
          {SLOTS.map((slot) => {
            const banner = banners.find((item) => item.position === slot.position);
            const isTop = slot.position === 'top';

            return (
              <Paper
                key={slot.position}
                variant="outlined"
                sx={{ borderRadius: `${RADIUS.md}px`, overflow: 'hidden' }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ p: 2, bgcolor: SURFACE.subtle }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      width: 40,
                      height: 40,
                      borderRadius: `${RADIUS.sm}px`,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                    {slot.icon}
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                      <Typography variant="h5" component="h2">
                        {slot.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={banner ? (banner.isActive ? 'Live' : 'Hidden') : 'Empty'}
                        color={banner ? (banner.isActive ? 'success' : 'default') : 'default'}
                        variant={banner?.isActive ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {slot.description}
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Formik
                  initialValues={initialValues(slot.position, banner)}
                  validationSchema={bannerSchema}
                  onSubmit={handleSubmit}
                  enableReinitialize
                >
                  {({ isSubmitting }) => (
                    <Form noValidate>
                      <Stack spacing={2} sx={{ p: { xs: 2, md: 2.5 } }}>
                        <FormTextField
                          name="title"
                          label={isTop ? 'Announcement text' : 'Headline'}
                          required
                          helperText={
                            isTop
                              ? 'For example: Free delivery on orders above 100 pieces.'
                              : 'Shown as the large heading on the home page.'
                          }
                        />

                        {isTop ? (
                          <FormRow>
                            <FormTextField
                              name="ctaLabel"
                              label="Button label"
                              helperText="Optional. Leave both fields empty for text only."
                            />
                            <FormTextField
                              name="link"
                              label="Button link"
                              helperText="A path like /products, or a full https:// URL."
                            />
                          </FormRow>
                        ) : (
                          <>
                            <FormTextField
                              name="subtitle"
                              label="Supporting line"
                              helperText="Optional. One sentence beneath the headline."
                            />
                            <ImageUploader
                              name="image"
                              label="Hero image"
                              folder="banners"
                              single
                              helperText="Landscape works best — it sits beside the headline."
                            />
                          </>
                        )}

                        <Divider />

                        <FormCheckboxField
                          name="isActive"
                          label={isTop ? 'Show the announcement bar' : 'Show this hero'}
                        />

                        <FormRow>
                          <FormDateField
                            name="startsAt"
                            label="Show from"
                            clearable
                            helperText="Optional. Leave empty to start immediately."
                          />
                          <FormDateField
                            name="endsAt"
                            label="Show until"
                            clearable
                            helperText="Optional. Leave empty to run indefinitely."
                          />
                        </FormRow>

                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {banner && (
                            <Button
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => setPendingClear(banner)}
                              disabled={isSubmitting}
                            >
                              Remove
                            </Button>
                          )}
                          <Button type="submit" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : 'Save'}
                          </Button>
                        </Stack>
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </Paper>
            );
          })}
        </Stack>
      </AsyncState>

      <ConfirmDialog
        open={pendingClear !== null}
        title="Remove this banner?"
        message="It will stop appearing on the storefront. You can set it up again at any time."
        confirmLabel="Remove"
        onConfirm={handleClear}
        onCancel={() => setPendingClear(null)}
      />
    </AdminLayout>
  );
}
