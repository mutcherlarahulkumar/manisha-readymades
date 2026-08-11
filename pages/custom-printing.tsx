/**
 * Custom printing services page.
 *
 * Every "request quote" action opens the brief dialog rather than jumping
 * straight to WhatsApp, so the owner receives a message they can actually quote
 * against.
 *
 * @module pages/custom-printing
 */
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { QuoteRequestDialog } from '@/components/quote/QuoteRequestDialog';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';

/** Services offered. Titles match the options in the quote form. */
const SERVICES = [
  {
    title: 'School Uniforms',
    detail: 'Shirts, trousers, pinafores and house tees printed to your school’s specification.',
  },
  {
    title: 'Company T-Shirts',
    detail: 'Staff and corporate wear with your logo, in bulk quantities.',
  },
  {
    title: 'Event T-Shirts',
    detail: 'Marathons, festivals, college fests — quick turnaround on large runs.',
  },
  {
    title: 'Political Campaigns',
    detail: 'Campaign tees and caps printed at short notice.',
  },
  {
    title: 'Promotional Clothing',
    detail: 'Giveaway and merchandise printing for launches and roadshows.',
  },
] as const;

/**
 * The custom printing landing page.
 *
 * @returns The page element.
 */
export default function CustomPrintingPage(): JSX.Element {
  // Holds the service to pre-select; `null` means the dialog is closed.
  const [quoteService, setQuoteService] = useState<string | null>(null);

  return (
    <StoreLayout
      title="Custom Printing"
      description="Bulk custom printing for school uniforms, company and event t-shirts, campaigns and promotional clothing."
    >
      <PageContainer>
        <Section
          title="Custom Printing Services"
          subtitle="Tell us the quantity, sizes and design — we will send rates on WhatsApp."
          action={
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => setQuoteService('')}
            >
              Request a quote
            </Button>
          }
        >
          <Box
            sx={{
              display: 'grid',
              gap: OUTER_SPACING,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            }}
          >
            {SERVICES.map((service) => (
              <Paper key={service.title} variant="outlined" sx={{ p: INNER_SPACING }}>
                <Stack spacing={INNER_SPACING} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="h6">{service.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {service.detail}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => setQuoteService(service.title)}
                  >
                    Request quote
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Section>

        <Section title="How it works">
          <Stack spacing={INNER_SPACING} component="ol" sx={{ pl: 3, m: 0 }}>
            <Typography component="li">
              Fill in the quote form with your design, quantity and size breakdown.
            </Typography>
            <Typography component="li">
              We receive it on WhatsApp and confirm fabric, print method and rates.
            </Typography>
            <Typography component="li">Approve the sample, and we start production.</Typography>
            <Typography component="li">Dispatch, with tracking shared over WhatsApp.</Typography>
          </Stack>
        </Section>
      </PageContainer>

      <QuoteRequestDialog
        open={quoteService !== null}
        service={quoteService ?? undefined}
        onClose={() => setQuoteService(null)}
      />
    </StoreLayout>
  );
}
