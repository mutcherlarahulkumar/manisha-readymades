/**
 * Custom-printing quote request dialog.
 *
 * The visitor completes a brief here first; only on a valid submit is WhatsApp
 * opened, pre-filled with the details. Sending the owner a blank "hi" costs a
 * round trip of questions before they can quote, which this avoids.
 *
 * @module components/quote/QuoteRequestDialog
 */
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useMemo } from 'react';

import {
  FormDateField,
  FormMultiSelectField,
  FormSelectField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { FormRow } from '@/components/form/FormLayout';
import { notifyError, notifySuccess } from '@/lib/toast';
import { OUTER_SPACING } from '@/theme/spacing';
import { SIZES } from '@/types/models';
import { buildQuoteRequestLink } from '@/utils/whatsapp';
import { QUOTE_SERVICES, quoteSchema, type QuoteFormValues } from '@/validation/quote.schema';

/** Props for {@link QuoteRequestDialog}. */
interface QuoteRequestDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selects the service when opened from a specific service card. */
  service?: string;
}

/**
 * Collects a printing brief and opens WhatsApp with it.
 *
 * @param props - Dialog state and the optionally pre-selected service.
 * @returns The dialog element.
 */
export function QuoteRequestDialog({
  open,
  onClose,
  service,
}: QuoteRequestDialogProps): JSX.Element {
  const theme = useTheme();
  const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const serviceOptions = useMemo<SelectOption[]>(
    () => QUOTE_SERVICES.map((option) => ({ value: option, label: option })),
    [],
  );

  const sizeOptions = useMemo<SelectOption[]>(
    () => SIZES.map((size) => ({ value: size, label: size })),
    [],
  );

  const initialValues = useMemo<QuoteFormValues>(
    () =>
      ({
        service: QUOTE_SERVICES.includes(service as (typeof QUOTE_SERVICES)[number])
          ? service
          : '',
        customerName: '',
        organisation: undefined,
        phone: '',
        city: '',
        quantity: 50,
        sizes: [],
        colorPreference: undefined,
        requiredBy: null,
        designNotes: '',
        notes: undefined,
      }) as unknown as QuoteFormValues,
    [service],
  );

  /**
   * Opens WhatsApp with the completed brief.
   *
   * The window is opened synchronously inside the submit handler: browsers block
   * `window.open` once an await has broken the user-gesture chain.
   */
  function handleSubmit(values: QuoteFormValues, helpers: FormikHelpers<QuoteFormValues>): void {
    const opened = window.open(buildQuoteRequestLink(values), '_blank', 'noopener,noreferrer');

    if (opened === null) {
      notifyError('Your browser blocked the WhatsApp window. Please allow pop-ups and try again.');
      helpers.setSubmitting(false);
      return;
    }

    notifySuccess('Opening WhatsApp with your quote request…');
    helpers.setSubmitting(false);
    helpers.resetForm();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isFullScreen}
      PaperProps={{ sx: { display: 'flex', flexDirection: 'column' } }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
      >
        <Box component="span" sx={{ minWidth: 0 }}>
          Request a printing quote
        </Box>
        {/* A dialog that fills a phone screen has no visible backdrop to tap,
            so without this the only way out is the browser's back gesture. */}
        <IconButton
          onClick={onClose}
          aria-label="Close"
          edge="end"
          sx={{ flexShrink: 0, mr: -0.5 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>


      <Formik
        initialValues={initialValues}
        validationSchema={quoteSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form
            noValidate
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            <DialogContent dividers sx={{ flex: 1 }}>
              <Alert severity="info" sx={{ mb: OUTER_SPACING }}>
                Fill in the details below and we will open WhatsApp with your brief ready to send.
              </Alert>

              <Stack spacing={OUTER_SPACING}>
                <FormSelectField
                  name="service"
                  label="Service"
                  options={serviceOptions}
                  required
                />

                <FormRow>
                  <FormTextField name="customerName" label="Your name" required />
                  <FormTextField
                    name="organisation"
                    label="School / company name"
                    helperText="Optional."
                  />
                </FormRow>

                <FormRow>
                  <FormTextField
                    name="phone"
                    label="Contact number"
                    type="tel"
                    required
                    helperText="10-digit mobile number."
                  />
                  <FormTextField name="city" label="City" required />
                </FormRow>

                <FormRow>
                  <FormTextField
                    name="quantity"
                    label="Quantity (pieces)"
                    type="number"
                    required
                    helperText="Minimum 10 pieces."
                  />
                  <FormMultiSelectField
                    name="sizes"
                    label="Sizes needed"
                    options={sizeOptions}
                    required
                  />
                </FormRow>

                <FormRow>
                  <FormTextField
                    name="colorPreference"
                    label="Preferred colours"
                    helperText="Optional."
                  />
                  <FormDateField
                    name="requiredBy"
                    label="Required by"
                    clearable
                    helperText="Optional."
                  />
                </FormRow>

                <FormTextField
                  name="designNotes"
                  label="Design / printing details"
                  multiline
                  rows={4}
                  required
                  helperText="Logo, text, print position, number of colours — anything that affects the rate."
                />

                <FormTextField
                  name="notes"
                  label="Additional notes"
                  multiline
                  rows={2}
                  helperText="Optional."
                />
              </Stack>
            </DialogContent>

            {/* Matches the enquiry dialog: stacked, full-width actions on a
                full-screen phone dialog, side by side on desktop. */}
            <DialogActions
              sx={{
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
