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
import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/tokens';
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
      <Typography variant="h2" component="h2" sx={{ mb: { xs: 3, md: 4 } }}>
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
        {/* Reviews are separated by hairlines rather than boxed individually.
            A column of outlined cards fragments a page that is already dense
            with panels; a divided list reads as one continuous body of
            feedback. */}
        <Stack
          divider={<Divider flexItem />}
          spacing={0}
          sx={{
            mb: { xs: 4, md: 6 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${RADIUS.md}px`,
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          {reviews.map((review) => (
            <Box key={review._id} sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                spacing={INNER_SPACING}
              >
                <Typography variant="subtitle2" sx={{ fontSize: '0.9375rem' }}>
                  {review.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {formatDate(review.createdAt)}
                </Typography>
              </Stack>
              <Rating value={review.rating} size="small" readOnly sx={{ my: 0.75 }} />
              <Typography variant="body2" color="text.secondary">
                {review.comment}
              </Typography>
            </Box>
          ))}
        </Stack>
      </AsyncState>

      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 }, borderRadius: `${RADIUS.md}px`, maxWidth: 560 }}
      >
        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
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
                  <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Submit review'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
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
