/**
 * Retailer application queue.
 *
 * Every application arriving from the storefront lands here. The screen is a
 * worklist rather than a record store: the default view is what nobody has
 * dealt with yet, and the only actions are the ones that move an application
 * forward.
 *
 * @module pages/admin/retailers/index
 */
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { AsyncState } from '@/components/common/StateViews';
import { FormSelectField, FormTextField, type SelectOption } from '@/components/form/fields';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { Paginated } from '@/types/api';
import { RETAILER_STATUSES, type RetailerApplication, type RetailerStatus } from '@/types/models';
import { retailerReviewSchema, type RetailerReviewValues } from '@/validation/retailer.schema';
import { toWhatsAppNumber } from '@/utils/whatsapp';

/** Tabs across the top, in the order an application moves through them. */
const TABS: { value: RetailerStatus | ''; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

/** Chip colour per status. */
const STATUS_COLOR: Record<RetailerStatus, 'warning' | 'info' | 'success' | 'default'> = {
  new: 'warning',
  contacted: 'info',
  approved: 'success',
  rejected: 'default',
};

/**
 * Formats an ISO timestamp as a short, unambiguous date.
 *
 * @param iso - The timestamp to format.
 * @returns A date string such as `21 Aug 2026`.
 */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Props for {@link ApplicationCard}. */
interface ApplicationCardProps {
  application: RetailerApplication;
  onReview: () => void;
}

/**
 * A single application, shown as a card rather than a table row.
 *
 * @param props - The application and its review action.
 * @returns The card element.
 *
 * @remarks
 * A table would need eight columns to hold this, which on a phone becomes a
 * horizontal scroll through the one screen an owner is most likely to open
 * away from a desk. The card keeps the shop, its location and the two ways of
 * reaching it in one glance.
 */
function ApplicationCard({ application, onReview }: ApplicationCardProps): JSX.Element {
  const whatsapp = application.whatsapp ?? application.phone;

  return (
    <Paper variant="outlined" sx={{ p: OUTER_SPACING }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={INNER_SPACING}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
            {application.shopName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {application.ownerName} · {application.city}, {application.state}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip
            size="small"
            label={application.status}
            color={STATUS_COLOR[application.status]}
            sx={{ textTransform: 'capitalize' }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatDate(application.createdAt)}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: INNER_SPACING }} />

      <Stack
        direction="row"
        sx={{ flexWrap: 'wrap', gap: INNER_SPACING, alignItems: 'center' }}
      >
        {application.gst && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            GST {application.gst}
          </Typography>
        )}

        {application.interests.map((interest) => (
          <Chip key={interest} size="small" variant="outlined" label={interest} />
        ))}
      </Stack>

      {application.notes && (
        <Box
          sx={{
            mt: INNER_SPACING,
            p: INNER_SPACING,
            borderRadius: `${RADIUS.sm}px`,
            bgcolor: SURFACE.subtle,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {application.notes}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={INNER_SPACING} sx={{ mt: OUTER_SPACING, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<PhoneIcon />}
          href={`tel:${application.phone}`}
        >
          {application.phone}
        </Button>
        <Button
          size="small"
          color="success"
          startIcon={<WhatsAppIcon />}
          href={`https://wa.me/${toWhatsAppNumber(whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </Button>
        <Button size="small" variant="outlined" onClick={onReview} sx={{ ml: 'auto' }}>
          Update status
        </Button>
      </Stack>
    </Paper>
  );
}

/**
 * The retailer application queue.
 *
 * @returns The page element.
 */
export default function AdminRetailersPage(): JSX.Element {
  const [tab, setTab] = useState<RetailerStatus | ''>('new');
  const [reviewing, setReviewing] = useState<RetailerApplication | null>(null);

  const { data, isLoading, error, refresh } = useResource<Paginated<RetailerApplication>>(
    `/api/retailers${tab ? `?status=${tab}` : ''}`,
  );

  const applications = useMemo(() => data?.items ?? [], [data]);

  /**
   * Explicitly typed so Formik infers the schema's own value type.
   *
   * Inferred from an object literal instead, `notes` becomes a required key
   * holding `undefined` rather than an optional one, and the submit handler no
   * longer matches.
   */
  const initialReview = useMemo<RetailerReviewValues>(
    () => ({ status: reviewing?.status ?? 'new', notes: reviewing?.notes }),
    [reviewing],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () =>
      RETAILER_STATUSES.map((status) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      })),
    [],
  );

  async function handleReview(
    values: RetailerReviewValues,
    helpers: FormikHelpers<RetailerReviewValues>,
  ): Promise<void> {
    if (!reviewing) return;
    try {
      await api(`/api/retailers/${reviewing._id}`, { method: 'PATCH', body: values });
      notifySuccess('Application updated');
      setReviewing(null);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not update this application.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <AdminLayout title="Retailers" subtitle="Wholesale account requests from the storefront">
      <Tabs
        value={tab}
        onChange={(_event, next: RetailerStatus | '') => setTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: OUTER_SPACING, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {TABS.map((entry) => (
          <Tab key={entry.value || 'all'} value={entry.value} label={entry.label} />
        ))}
      </Tabs>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={applications.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: tab === 'new' ? 'Nothing waiting' : 'No applications here',
          description:
            tab === 'new'
              ? 'New wholesale account requests will appear here as they arrive.'
              : 'Try another tab to see applications at a different stage.',
        }}
      >
        <Stack spacing={OUTER_SPACING}>
          {applications.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              onReview={() => setReviewing(application)}
            />
          ))}
        </Stack>
      </AsyncState>

      <Dialog
        open={reviewing !== null}
        onClose={() => setReviewing(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{reviewing?.shopName}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={initialReview}
            validationSchema={retailerReviewSchema}
            onSubmit={handleReview}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={OUTER_SPACING}>
                  <FormSelectField name="status" label="Status" options={statusOptions} required />
                  <FormTextField
                    name="notes"
                    label="Notes"
                    multiline
                    rows={3}
                    helperText="Internal only — the applicant never sees this."
                  />

                  <Stack direction="row" spacing={INNER_SPACING} justifyContent="flex-end">
                    <Button onClick={() => setReviewing(null)} disabled={isSubmitting}>
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
    </AdminLayout>
  );
}
