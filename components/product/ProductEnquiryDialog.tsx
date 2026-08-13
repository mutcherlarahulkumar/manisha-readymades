/**
 * Product enquiry dialog.
 *
 * A visitor must pick the size and colour they actually want before WhatsApp
 * opens, so the owner receives a specific request rather than "interested in
 * this product" against an item stocked in six sizes and four colours.
 *
 * @module components/product/ProductEnquiryDialog
 */
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Form, Formik, useField, useFormikContext, type FormikHelpers } from 'formik';
import { useMemo } from 'react';

import { FormTextField } from '@/components/form/fields';
import { trackEvent } from '@/lib/analytics';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { ProductListItem } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { buildProductEnquiryLink } from '@/utils/whatsapp';
import { buildEnquirySchema, type EnquiryFormValues } from '@/validation/enquiry.schema';

/** Props for {@link ChipSelectField}. */
interface ChipSelectFieldProps {
  name: string;
  label: string;
  options: readonly string[];
}

/**
 * A single-choice field rendered as selectable chips.
 *
 * Sizes and colours are short, mutually exclusive lists, so chips are quicker to
 * scan and tap than a dropdown — especially on a phone.
 *
 * @param props - Field name, label and available options.
 * @returns The field element.
 */
function ChipSelectField({ name, label, options }: ChipSelectFieldProps): JSX.Element {
  const [field, meta] = useField<string>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<EnquiryFormValues>();
  const showError = Boolean(meta.error) && meta.touched;

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 1 }}>
        {label} *
      </Typography>
      {/* A radio group in substance, so it is announced as one and is arrow-key
          navigable, while presenting as the chips that are far quicker to tap. */}
      <Stack
        direction="row"
        role="radiogroup"
        aria-label={label}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {options.map((option) => {
          const isSelected = field.value === option;
          return (
            <Chip
              key={option}
              label={option}
              clickable
              role="radio"
              aria-checked={isSelected}
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => {
                void setFieldValue(name, option);
                void setFieldTouched(name, true, false);
              }}
              sx={{
                height: 38,
                px: 0.5,
                fontSize: '0.875rem',
                borderWidth: isSelected ? 1 : 1,
                transition: 'background-color 160ms, border-color 160ms, color 160ms',
              }}
            />
          );
        })}
      </Stack>
      {showError && <FormHelperText error>{meta.error}</FormHelperText>}
    </Box>
  );
}

/** Props for {@link ProductEnquiryDialog}. */
interface ProductEnquiryDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductListItem;
}

/**
 * Collects the wanted variant, then opens WhatsApp with it.
 *
 * @param props - Dialog state and the product being enquired about.
 * @returns The dialog element.
 */
export function ProductEnquiryDialog({
  open,
  onClose,
  product,
}: ProductEnquiryDialogProps): JSX.Element {
  const theme = useTheme();
  const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Constrained to this product's own variants, so an unstocked combination
  // cannot be requested.
  const validationSchema = useMemo(
    () => buildEnquirySchema(product.sizes, product.colors),
    [product.sizes, product.colors],
  );

  const initialValues = useMemo<EnquiryFormValues>(
    () => ({
      // Pre-select when there is only one option — asking is pointless then.
      size: product.sizes.length === 1 ? (product.sizes[0] as string) : '',
      color: product.colors.length === 1 ? (product.colors[0] as string) : '',
      quantity: 10,
      notes: undefined,
    }),
    [product.sizes, product.colors],
  );

  /**
   * Opens WhatsApp with the completed enquiry.
   *
   * `window.open` runs synchronously inside the handler: an intervening await
   * breaks the user-gesture chain and browsers then block the pop-up.
   */
  function handleSubmit(values: EnquiryFormValues, helpers: FormikHelpers<EnquiryFormValues>): void {
    const opened = window.open(
      buildProductEnquiryLink(product, values),
      '_blank',
      'noopener,noreferrer',
    );

    if (opened === null) {
      notifyError('Your browser blocked the WhatsApp window. Please allow pop-ups and try again.');
      helpers.setSubmitting(false);
      return;
    }

    trackEvent('whatsapp_click', product._id);
    notifySuccess('Opening WhatsApp with your enquiry…');
    helpers.setSubmitting(false);
    helpers.resetForm();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={isFullScreen}>
      <DialogTitle>Enquire about this product</DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogContent dividers>
              <Stack spacing={INNER_SPACING}>
                {/* The product being enquired about, restated on a tinted
                    panel so the visitor can confirm at a glance that the
                    dialog belongs to the item they tapped. */}
                <Box sx={{ p: 1.5, borderRadius: `${RADIUS.sm}px`, bgcolor: SURFACE.subtle }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {product.sku} · {formatCurrency(product.pricing.finalPrice)}
                  </Typography>
                </Box>

                <ChipSelectField name="size" label="Size" options={product.sizes} />
                <ChipSelectField name="color" label="Colour" options={product.colors} />

                <FormTextField
                  name="quantity"
                  label="Quantity (pieces)"
                  type="number"
                  required
                  helperText="How many pieces you need."
                />

                <FormTextField
                  name="notes"
                  label="Notes"
                  multiline
                  rows={2}
                  helperText="Optional — packing, delivery city, anything else."
                />
              </Stack>
            </DialogContent>

            {/* On a full-screen phone dialog the actions stack and the primary
                one spans the width, which is both easier to hit and clearer
                about which action is the intended one. */}
            <DialogActions
              sx={{
                p: 2,
                gap: 1,
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
              }}
            >
              <Button
                onClick={onClose}
                disabled={isSubmitting}
                fullWidth={isFullScreen}
                size={isFullScreen ? 'large' : 'medium'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                disabled={isSubmitting}
                fullWidth={isFullScreen}
                size={isFullScreen ? 'large' : 'medium'}
              >
                Send on WhatsApp
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
