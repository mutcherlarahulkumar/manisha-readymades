/**
 * Contact page. There is no contact form by design — every enquiry is routed to
 * WhatsApp, which is where the owner already works.
 *
 * @module pages/contact
 */
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { PageContainer, Section } from '@/components/common/PageContainer';
import { BrandLockup } from '@/components/layout/BrandLockup';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { publicEnv } from '@/lib/env';
import { INNER_SPACING, OUTER_SPACING, SECTION_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
import { buildGeneralEnquiryLink } from '@/utils/whatsapp';

/** Props for {@link ContactMethod}. */
interface ContactMethodProps {
  icon: JSX.Element;
  label: string;
  /** The address, number or destination, shown as the primary line. */
  value: string;
  href: string;
  /** Opens in a new tab, for destinations that leave the site. */
  external?: boolean;
  /** Renders the tile in the accent treatment, for the preferred channel. */
  emphasised?: boolean;
}

/**
 * A single contact channel, rendered as a large tappable tile.
 *
 * @param props - Channel details and presentation.
 * @returns The tile element.
 */
function ContactMethod({
  icon,
  label,
  value,
  href,
  external = false,
  emphasised = false,
}: ContactMethodProps): JSX.Element {
  return (
    <Box
      component="a"
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        // A generous target: this is the page's entire purpose, and most
        // visitors reach it on a phone.
        p: INNER_SPACING,
        borderRadius: `${RADIUS.md}px`,
        textDecoration: 'none',
        border: '1px solid',
        borderColor: emphasised ? 'success.main' : 'divider',
        bgcolor: emphasised ? 'success.main' : 'background.paper',
        color: emphasised ? 'common.white' : 'text.primary',
        transition:
          'transform 240ms cubic-bezier(0.22,1,0.36,1), box-shadow 240ms, border-color 240ms',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: SHADOW.md,
          borderColor: emphasised ? 'success.dark' : SURFACE.borderStrong,
        },
        '&:hover .contact-method__arrow': { transform: 'translateX(4px)' },
        '@media (hover: none)': { '&:hover': { transform: 'none', boxShadow: 'none' } },
        '@media (prefers-reduced-motion: reduce)': {
          '&:hover': { transform: 'none' },
          '&:hover .contact-method__arrow': { transform: 'none' },
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: `${RADIUS.sm}px`,
          bgcolor: emphasised ? 'rgba(255,255,255,0.18)' : SURFACE.subtle,
          color: emphasised ? 'common.white' : 'primary.main',
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            opacity: emphasised ? 0.85 : 1,
            color: emphasised ? 'inherit' : 'text.secondary',
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: '1rem', wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>

      <ArrowForwardIcon
        className="contact-method__arrow"
        sx={{ flexShrink: 0, fontSize: 18, opacity: 0.7, transition: 'transform 220ms' }}
      />
    </Box>
  );
}

/**
 * The contact page.
 *
 * @returns The page element.
 */
export default function ContactPage(): JSX.Element {
  return (
    <StoreLayout
      title="Contact"
      description="Call or WhatsApp Manisha Readymades for wholesale enquiries."
    >
      <PageContainer>
        <Section title="Contact Us" subtitle="We reply fastest on WhatsApp.">
          {/*
            Two columns on desktop. The page carries only three links, which
            left two thirds of a wide screen empty beside them; the brand fills
            that half instead of the layout pretending the content is wider than
            it is. On mobile the columns stack and the brand falls below the
            contact details, where it is a sign-off rather than an obstacle
            between the visitor and the WhatsApp button.
          */}
          <Box
            sx={{
              display: 'grid',
              gap: SECTION_SPACING,
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 0.85fr)' },
              alignItems: 'center',
            }}
          >
            <Box sx={{ maxWidth: 560, width: '100%' }}>
              <RevealGroup sx={{ display: 'grid', gap: 1.5 }}>
                <RevealItem>
                  <ContactMethod
                    emphasised
                    external
                    icon={<WhatsAppIcon />}
                    label="WhatsApp"
                    value="Message us on WhatsApp"
                    href={buildGeneralEnquiryLink()}
                  />
                </RevealItem>

                {publicEnv.contactPhone && (
                  <RevealItem>
                    <ContactMethod
                      icon={<PhoneIcon />}
                      label="Phone"
                      value={publicEnv.contactPhone}
                      href={`tel:${publicEnv.contactPhone}`}
                    />
                  </RevealItem>
                )}

                {publicEnv.googleMapsUrl && (
                  <RevealItem>
                    <ContactMethod
                      external
                      icon={<PlaceIcon />}
                      label="Visit"
                      value="Find us on Google Maps"
                      href={publicEnv.googleMapsUrl}
                    />
                  </RevealItem>
                )}
              </RevealGroup>

              <Reveal delay={0.1}>
                <Stack
                  sx={{
                    mt: OUTER_SPACING,
                    p: INNER_SPACING,
                    borderRadius: `${RADIUS.md}px`,
                    bgcolor: SURFACE.subtle,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Bulk orders, custom printing and stock availability — send us a message and we
                    will get back to you the same day.
                  </Typography>
                </Stack>
              </Reveal>
            </Box>

            <Reveal fadeOnly delay={0.15}>
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2.5}
                sx={{
                  p: OUTER_SPACING,
                  borderRadius: `${RADIUS.lg}px`,
                  bgcolor: SURFACE.subtle,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <BrandLockup size={260} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ maxWidth: '28ch' }}
                >
                  Wholesale garment supplier since 2020.
                </Typography>
              </Stack>
            </Reveal>
          </Box>
        </Section>
      </PageContainer>
    </StoreLayout>
  );
}
