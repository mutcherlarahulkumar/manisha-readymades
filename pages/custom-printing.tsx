/**
 * Custom printing services page.
 *
 * Every "request quote" action opens the brief dialog rather than jumping
 * straight to WhatsApp, so the owner receives a message they can actually quote
 * against.
 *
 * @module pages/custom-printing
 */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { PageContainer, Section } from '@/components/common/PageContainer';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { QuoteRequestDialog } from '@/components/quote/QuoteRequestDialog';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';

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

/** The four stages of an order, shown as a numbered sequence. */
const PROCESS_STEPS = [
  'Fill in the quote form with your design, quantity and size breakdown.',
  'We receive it on WhatsApp and confirm fabric, print method and rates.',
  'Approve the sample, and we start production.',
  'Dispatch, with tracking shared over WhatsApp.',
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
              size="large"
              startIcon={<WhatsAppIcon />}
              onClick={() => setQuoteService('')}
            >
              Request a quote
            </Button>
          }
        >
          <RevealGroup
            sx={{
              display: 'grid',
              gap: OUTER_SPACING,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {SERVICES.map((service) => (
              <RevealItem key={service.title} sx={{ height: '100%' }}>
                <Stack
                  sx={{
                    height: '100%',
                    p: INNER_SPACING,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${RADIUS.md}px`,
                    transition:
                      'transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms, border-color 260ms',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: SHADOW.md,
                      borderColor: SURFACE.borderStrong,
                    },
                    '@media (hover: none)': {
                      '&:hover': { transform: 'none', boxShadow: 'none' },
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                      '&:hover': { transform: 'none' },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                    <Typography variant="h5" component="h3">
                      {service.title}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2.5 }}>
                    {service.detail}
                  </Typography>

                  <Button
                    variant="outlined"
                    color="success"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => setQuoteService(service.title)}
                    sx={{ alignSelf: 'flex-start' }}
                    aria-label={`Request quote for ${service.title}`}
                  >
                    Request quote
                  </Button>
                </Stack>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>

        <Section title="How it works">
          {/*
            A numbered sequence rather than a plain list. The connecting rule
            between the markers carries the sense of a process running from top
            to bottom, which four bullet points do not.
          */}
          <RevealGroup component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {PROCESS_STEPS.map((step, index) => {
              const isLast = index === PROCESS_STEPS.length - 1;
              return (
                <RevealItem component="li" key={step} sx={{ display: 'flex', gap: 2.5 }}>
                  <Stack alignItems="center" sx={{ flexShrink: 0 }}>
                    <Box
                      aria-hidden
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {index + 1}
                    </Box>
                    {!isLast && (
                      <Box sx={{ width: '2px', flexGrow: 1, bgcolor: 'divider', my: 0.5 }} />
                    )}
                  </Stack>

                  <Typography
                    variant="body1"
                    sx={{ pt: 0.75, pb: isLast ? 0 : 4, color: 'text.primary' }}
                  >
                    {step}
                  </Typography>
                </RevealItem>
              );
            })}
          </RevealGroup>
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
