/**
 * Wholesale account request page.
 *
 * Unlike the product enquiry and quote forms, which only open WhatsApp, this
 * one is recorded first. An account request carries details worth keeping — GST
 * registration, trading state, what the shop stocks — and a message that is
 * never sent, or is lost in a busy chat, would take the retailer with it.
 *
 * @module pages/become-a-retailer
 */
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Form, Formik, useFormikContext, type FormikHelpers } from 'formik';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useState } from 'react';

import { CatalogueDownload } from '@/components/common/CatalogueDownload';
import { PageContainer, Section } from '@/components/common/PageContainer';
import { FormTextField, FormTagsField } from '@/components/form/fields';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Reveal } from '@/components/motion/Reveal';
import { api } from '@/lib/http';
import { connectToDatabase } from '@/lib/mongodb';
import { notifyError } from '@/lib/toast';
import { getCatalogue } from '@/services/catalogue.service';
import { listCategories } from '@/services/taxonomy.service';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
import type { Catalogue, CategoryWithParent } from '@/types/models';
import { buildRetailerApplicationLink } from '@/utils/whatsapp';
import {
  retailerApplicationSchema,
  type RetailerApplicationValues,
} from '@/validation/retailer.schema';

/** What a retailer gets, stated before the form asks for anything. */
const BENEFITS = [
  'Wholesale rates with room for your margin',
  'Bulk quantities across men’s, women’s and kids’ wear',
  'Custom printing for uniforms and events',
  'Same-day replies on stock and orders',
] as const;

/** Props supplied by {@link getServerSideProps}. */
interface BecomeRetailerPageProps {
  /** Feeds the category strip and the "interested in" suggestions. */
  categories: CategoryWithParent[];
  /** The downloadable catalogue, or `null` when none is uploaded. */
  catalogue: Catalogue | null;
}

/** An empty application. */
const BLANK: RetailerApplicationValues = {
  shopName: '',
  ownerName: '',
  phone: '',
  whatsapp: undefined,
  city: '',
  state: '',
  gst: undefined,
  interests: [],
};

/**
 * Offers to copy the phone number into the WhatsApp field.
 *
 * @returns The shortcut button, or nothing when it would not help.
 *
 * @remarks
 * The two are the same number for most shops. Asking for it twice is the kind
 * of small friction that loses a form submission, and pre-filling it silently
 * would be wrong for the shops where they differ.
 */
function CopyPhoneToWhatsApp(): JSX.Element | null {
  const { values, setFieldValue } = useFormikContext<RetailerApplicationValues>();
  const canCopy = values.phone.length > 0 && values.whatsapp !== values.phone;

  if (!canCopy) return null;

  return (
    <Button
      size="small"
      onClick={() => void setFieldValue('whatsapp', values.phone)}
      sx={{ alignSelf: 'flex-start' }}
    >
      Same as phone number
    </Button>
  );
}

/**
 * The wholesale account request page.
 *
 * @param props - Server-rendered categories.
 * @returns The page element.
 */
export default function BecomeRetailerPage({
  categories,
  catalogue,
}: BecomeRetailerPageProps): JSX.Element {
  const [submitted, setSubmitted] = useState(false);

  /**
   * Stores the application, then hands the applicant to WhatsApp.
   *
   * The record is written first and awaited: if the network fails, the form
   * stays put with an error rather than claiming success. WhatsApp is opened
   * afterwards and its failure is not fatal — the details are already safe, so
   * a blocked pop-up costs a notification, not the application.
   */
  async function handleSubmit(
    values: RetailerApplicationValues,
    helpers: FormikHelpers<RetailerApplicationValues>,
  ): Promise<void> {
    try {
      await api('/api/retailers', { method: 'POST', body: values, anonymous: true });
      setSubmitted(true);
      window.open(buildRetailerApplicationLink(values), '_blank', 'noopener,noreferrer');
      helpers.resetForm();
    } catch (error) {
      notifyError(error, 'Could not send your details. Please try again.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <StoreLayout
      title="Become a Retailer"
      description="Buy wholesale from Manisha Readymades — send your shop details and we will be in touch."
      categories={categories}
    >
      <PageContainer>
        <Section
          title="Become a Retailer"
          subtitle="Want to buy wholesale from Manisha Readymades?"
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 6 },
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 0.8fr)' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {submitted ? (
                <Reveal>
                  <Stack
                    spacing={INNER_SPACING}
                    sx={{
                      p: OUTER_SPACING,
                      borderRadius: `${RADIUS.md}px`,
                      border: '1px solid',
                      borderColor: 'success.main',
                      bgcolor: SURFACE.subtle,
                    }}
                  >
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 36 }} />
                    <Typography variant="h6" component="p">
                      Thank you — we have your details.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      We will call or message you shortly. If WhatsApp did not open, there is
                      nothing to do — your details have already reached us.
                    </Typography>
                    <Stack direction="row" spacing={INNER_SPACING} sx={{ pt: 1 }}>
                      <Button component={NextLink} href="/products" variant="contained">
                        Browse the catalogue
                      </Button>
                      <Button onClick={() => setSubmitted(false)}>Send another</Button>
                    </Stack>
                  </Stack>
                </Reveal>
              ) : (
                <Formik
                  initialValues={BLANK}
                  validationSchema={retailerApplicationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form noValidate>
                      <Stack spacing={OUTER_SPACING}>
                        <FormTextField name="shopName" label="Shop name" required />
                        <FormTextField name="ownerName" label="Owner name" required />

                        <FormTextField
                          name="phone"
                          label="Phone"
                          type="tel"
                          required
                          helperText="10-digit mobile number."
                        />

                        <Stack spacing={1}>
                          <FormTextField name="whatsapp" label="WhatsApp" type="tel" />
                          <CopyPhoneToWhatsApp />
                        </Stack>

                        <FormTextField name="city" label="City" required />
                        <FormTextField name="state" label="State" required />

                        <FormTextField
                          name="gst"
                          label="GST number"
                          helperText="Optional — leave blank if your shop is not registered."
                        />

                        <FormTagsField
                          name="interests"
                          label="Products interested in"
                          required
                          helperText="Type a product type and press Enter — T-Shirts, Nightwear, Innerwear."
                        />

                        <Button
                          type="submit"
                          size="large"
                          variant="contained"
                          color="success"
                          startIcon={<WhatsAppIcon />}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Sending…' : 'Send my details'}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                          Your details reach us directly. We use them only to set up your
                          wholesale account.
                        </Typography>
                      </Stack>
                    </Form>
                  )}
                </Formik>
              )}
            </Box>

            {/* The case for applying, kept beside the form rather than above
                it, so the form is the first thing in reach on a phone. */}
            <Reveal fadeOnly delay={0.1}>
              <Stack
                spacing={INNER_SPACING}
                sx={{
                  p: OUTER_SPACING,
                  borderRadius: `${RADIUS.md}px`,
                  bgcolor: SURFACE.subtle,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: SHADOW.xs,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  What you get
                </Typography>
                {BENEFITS.map((benefit) => (
                  <Stack key={benefit} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleOutlineIcon
                      aria-hidden
                      color="success"
                      sx={{ fontSize: 18, mt: '2px', flexShrink: 0 }}
                    />
                    <Typography variant="body2">{benefit}</Typography>
                  </Stack>
                ))}
              </Stack>

              {/* Someone weighing up an application wants to see the range
                  first. The catalogue answers that without making them fill in
                  the form to find out. */}
              {catalogue && (
                <Box sx={{ mt: OUTER_SPACING }}>
                  <CatalogueDownload catalogue={catalogue} />
                </Box>
              )}
            </Reveal>
          </Box>
        </Section>
      </PageContainer>
    </StoreLayout>
  );
}

/**
 * Loads the categories the shell's navigation needs.
 *
 * @returns Page props.
 */
export const getServerSideProps: GetServerSideProps<BecomeRetailerPageProps> = async () => {
  await connectToDatabase();
  const [categories, catalogue] = await Promise.all([
    listCategories({ activeOnly: true }),
    getCatalogue(),
  ]);
  return { props: { categories, catalogue } };
};
