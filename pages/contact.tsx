/**
 * Contact page. There is no contact form by design — every enquiry is routed to
 * WhatsApp, which is where the owner already works.
 *
 * @module pages/contact
 */
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { publicEnv } from '@/lib/env';
import { INNER_SPACING } from '@/theme/spacing';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/**
 * The contact page.
 *
 * @returns The page element.
 */
export default function ContactPage(): JSX.Element {
  return (
    <StoreLayout title="Contact" description="Call or WhatsApp Manisha Readymades for wholesale enquiries.">
      <PageContainer>
        <Section title="Contact Us" subtitle="We reply fastest on WhatsApp.">
          <Paper variant="outlined" sx={{ p: INNER_SPACING, maxWidth: 520 }}>
            <Stack spacing={INNER_SPACING}>
              <Button
                size="large"
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                href={buildGeneralEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message us on WhatsApp
              </Button>

              {publicEnv.contactPhone && (
                <Button
                  size="large"
                  variant="outlined"
                  startIcon={<PhoneIcon />}
                  href={`tel:${publicEnv.contactPhone}`}
                >
                  {publicEnv.contactPhone}
                </Button>
              )}

              {publicEnv.googleMapsUrl && (
                <Button
                  size="large"
                  variant="outlined"
                  startIcon={<PlaceIcon />}
                  href={publicEnv.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find us on Google Maps
                </Button>
              )}

              <Typography variant="body2" color="text.secondary">
                Bulk orders, custom printing and stock availability — send us a message and we will
                get back to you the same day.
              </Typography>
            </Stack>
          </Paper>
        </Section>
      </PageContainer>
    </StoreLayout>
  );
}
