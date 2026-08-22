/**
 * The wholesale catalogue download.
 *
 * @module components/common/CatalogueDownload
 */
import DownloadIcon from '@mui/icons-material/Download';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { Catalogue } from '@/types/models';

/** Props for {@link CatalogueDownload}. */
interface CatalogueDownloadProps {
  /** The stored catalogue, or `null` when the admin has not uploaded one. */
  catalogue: Catalogue | null;
  /** Renders the compact inline button instead of the full band. */
  compact?: boolean;
}

/**
 * Formats the catalogue's last update as a month and year.
 *
 * @param iso - The timestamp to format.
 * @returns A string such as `August 2026`.
 */
function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/**
 * Offers the catalogue PDF for download.
 *
 * @param props - The catalogue and the presentation wanted.
 * @returns The download, or `null` when there is nothing to download.
 *
 * @remarks
 * Renders nothing at all when no catalogue has been uploaded. A button that
 * explains it has no file is worse than an absent button: it advertises a
 * missing feature on every page it appears.
 *
 * The link carries `download`, which asks the browser to save rather than
 * navigate. Cloudinary serves the PDF from its own origin, so the attribute is
 * a hint the browser may ignore and open the file in a tab instead — either
 * outcome puts the catalogue in front of the retailer, which is the point.
 */
export function CatalogueDownload({
  catalogue,
  compact = false,
}: CatalogueDownloadProps): JSX.Element | null {
  if (!catalogue) return null;

  const button = (
    <Button
      component="a"
      href={catalogue.file.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      variant="contained"
      size={compact ? 'medium' : 'large'}
      startIcon={<DownloadIcon />}
      sx={{ flexShrink: 0 }}
    >
      Download Catalogue
    </Button>
  );

  if (compact) return button;

  return (
    <Box
      sx={{
        p: OUTER_SPACING,
        borderRadius: `${RADIUS.md}px`,
        bgcolor: SURFACE.subtle,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={INNER_SPACING}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
            Wholesale Catalogue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {catalogue.label
              ? `${catalogue.label} · updated ${formatUpdated(catalogue.updatedAt)}`
              : `Our full range and wholesale rates · updated ${formatUpdated(catalogue.updatedAt)}`}
          </Typography>
        </Box>

        {button}
      </Stack>
    </Box>
  );
}
