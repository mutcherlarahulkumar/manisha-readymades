/**
 * Product review list and submission form.
 *
 * Reviews are text-only by design and are held for moderation, which the form
 * states plainly so a visitor is not surprised when their review does not
 * appear immediately.
 *
 * @module components/product/ProductReviews
 */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Form, Formik, useField, useFormikContext, type FormikHelpers } from 'formik';
import { useCallback } from 'react';

import { FormTextField } from '@/components/form/fields';
import { AsyncState } from '@/components/common/StateViews';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { Review } from '@/types/models';
import { formatDate } from '@/utils/format';
import { reviewCreateSchema, type ReviewFormValues } from '@/validation/marketing.schema';

/** Initial values for the review form. */
const INITIAL_VALUES: ReviewFormValues = {
  customerName: '',
  rating: 0,
  comment: '',
};

/**
 * Formik-bound star rating control.
 *
 * @returns The rating field element.
 */
function RatingField(): JSX.Element {
  const [field, meta] = useField<number>('rating');
  const { setFieldValue, setFieldTouched } = useFormikContext<ReviewFormValues>();
  const showError = Boolean(meta.error) && meta.touched;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
        Your rating *
      </Typography>
      <Rating
        name="rating"
        value={field.value || null}
        onChange={(_event, value) => {
          void setFieldValue('rating', value ?? 0);
          void setFieldTouched('rating', true, false);
        }}
      />
      {showError && <FormHelperText error>{meta.error}</FormHelperText>}
    </Box>
  );
}

/** Props for {@link ProductReviews}. */
interface ProductReviewsProps {
  productId: string;
  reviews: readonly Review[];
  isLoading: boolean;
  error: unknown;
  /** Refreshes the list after a successful submission. */
  onSubmitted: () => void;
}

/**
 * Renders approved reviews and the submission form.
 *
 * @param props - Product id, review data and the refresh callback.
 * @returns The reviews section.
 */
export function ProductReviews({
  productId,
  reviews,
  isLoading,
  error,
  onSubmitted,
}: ProductReviewsProps): JSX.Element {
  const handleSubmit = useCallback(
    async (
      values: ReviewFormValues,
      helpers: FormikHelpers<ReviewFormValues>,
    ): Promise<void> => {
      try {
        const result = await api<{ message: string }>(`/api/products/${productId}/reviews`, {
          method: 'POST',
          body: values,
          anonymous: true,
        });
        notifySuccess(result.message);
        helpers.resetForm();
        onSubmitted();
      } catch (submitError) {
        notifyError(submitError, 'Could not submit your review.');
      } finally {
        helpers.setSubmitting(false);
      }
    },
    [productId, onSubmitted],
  );

  return (
    <Box>
      <Typography variant="h3" component="h2" sx={{ mb: OUTER_SPACING }}>
        Customer reviews
      </Typography>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={reviews.length === 0}
        empty={{
          title: 'No reviews yet',
          description: 'Be the first to share your experience with this product.',
        }}
      >
        <Stack spacing={INNER_SPACING} sx={{ mb: OUTER_SPACING }}>
          {reviews.map((review) => (
            <Paper key={review._id} variant="outlined" sx={{ p: INNER_SPACING }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={INNER_SPACING}
              >
                <Typography variant="subtitle2">{review.customerName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(review.createdAt)}
                </Typography>
              </Stack>
              <Rating value={review.rating} size="small" readOnly sx={{ my: 0.5 }} />
              <Typography variant="body2">{review.comment}</Typography>
            </Paper>
          ))}
        </Stack>
      </AsyncState>

      <Divider sx={{ my: OUTER_SPACING }} />

      <Paper variant="outlined" sx={{ p: INNER_SPACING }}>
        <Typography variant="h5" component="h3" sx={{ mb: INNER_SPACING }}>
          Write a review
        </Typography>

        <Formik
          initialValues={INITIAL_VALUES}
          validationSchema={reviewCreateSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <Stack spacing={INNER_SPACING}>
                <RatingField />
                <FormTextField name="customerName" label="Your name" required />
                <FormTextField
                  name="comment"
                  label="Your review"
                  multiline
                  rows={4}
                  required
                  helperText="Text only — please do not include images or contact details."
                />
                <Box>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Submit review'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Reviews appear once they have been approved.
                  </Typography>
                </Box>
              </Stack>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
}
