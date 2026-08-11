/**
 * Review moderation.
 *
 * Nothing a visitor writes appears on the storefront until it is approved here,
 * and every decision recomputes the product's rating aggregates.
 *
 * @module pages/admin/reviews/index
 */
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { OUTER_SPACING } from '@/theme/spacing';
import { REVIEW_STATUSES, type ReviewStatus, type ReviewWithProduct } from '@/types/models';
import { formatDate, REVIEW_STATUS_LABEL } from '@/utils/format';

/** Chip colour per moderation status. */
const STATUS_COLOR: Record<ReviewStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

/**
 * The review moderation queue.
 *
 * @returns The page element.
 */
export default function AdminReviewsPage(): JSX.Element {
  const router = useRouter();
  const initialStatus =
    typeof router.query.status === 'string' && REVIEW_STATUSES.includes(router.query.status as ReviewStatus)
      ? (router.query.status as ReviewStatus)
      : 'pending';

  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [pendingDelete, setPendingDelete] = useState<ReviewWithProduct | null>(null);

  const { data, isLoading, error, refresh } = useResource<ReviewWithProduct[]>(
    `/api/reviews?status=${status}`,
  );
  const reviews = data ?? [];

  async function moderate(review: ReviewWithProduct, next: ReviewStatus): Promise<void> {
    try {
      await api(`/api/reviews/${review._id}`, { method: 'PATCH', body: { status: next } });
      notifySuccess(next === 'approved' ? 'Review approved and published' : 'Review rejected');
      await refresh();
    } catch (moderateError) {
      notifyError(moderateError, 'Could not update this review.');
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/reviews/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess('Review deleted');
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this review.');
    }
  }

  return (
    <AdminLayout title="Reviews" subtitle="Approve what appears on product pages">
      <Tabs
        value={status}
        onChange={(_event, next: ReviewStatus) => setStatus(next)}
        sx={{ mb: OUTER_SPACING }}
      >
        {REVIEW_STATUSES.map((value) => (
          <Tab key={value} value={value} label={REVIEW_STATUS_LABEL[value]} />
        ))}
      </Tabs>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={reviews.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title:
            status === 'pending'
              ? 'Nothing waiting for approval'
              : `No ${REVIEW_STATUS_LABEL[status].toLowerCase()} reviews`,
          description:
            status === 'pending'
              ? 'New customer reviews will appear here for you to approve.'
              : undefined,
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {review.product?.name ?? 'Deleted product'}
                    </Typography>
                    {review.product && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {review.product.sku}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{review.customerName}</TableCell>
                  <TableCell>
                    <Rating value={review.rating} size="small" readOnly />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2">{review.comment}</Typography>
                  </TableCell>
                  <TableCell>{formatDate(review.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={REVIEW_STATUS_LABEL[review.status]}
                      color={STATUS_COLOR[review.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {review.status !== 'approved' && (
                        <Tooltip title="Approve and publish">
                          <IconButton size="small" color="success" onClick={() => void moderate(review, 'approved')}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {review.status !== 'rejected' && (
                        <Tooltip title="Reject">
                          <IconButton size="small" color="warning" onClick={() => void moderate(review, 'rejected')}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete permanently">
                        <IconButton size="small" color="error" onClick={() => setPendingDelete(review)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AsyncState>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete review?"
        message="This review will be permanently removed and the product's rating recalculated."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
