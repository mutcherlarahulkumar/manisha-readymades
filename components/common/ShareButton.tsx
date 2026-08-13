/**
 * Share control.
 *
 * @module components/common/ShareButton
 */
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IosShareIcon from '@mui/icons-material/IosShare';
import ShareIcon from '@mui/icons-material/Share';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useState } from 'react';

import { notifyError, notifySuccess } from '@/lib/toast';
import { RADIUS } from '@/theme/tokens';

/** Props for {@link ShareButton}. */
interface ShareButtonProps {
  /** What is being shared, used as the message text. */
  title: string;
  /**
   * Absolute or root-relative URL. Root-relative values are resolved against
   * the current origin, since the share targets need a full address.
   */
  url?: string;
  /** Renders as an icon-only button, for tight rows. */
  compact?: boolean;
}

/**
 * Shares the current page to WhatsApp, Telegram, the device's own share sheet,
 * or the clipboard.
 *
 * @param props - What to share and how to present the control.
 * @returns The share button and its menu.
 *
 * @remarks
 * The named targets are always listed rather than deferring wholesale to
 * `navigator.share`. The native sheet is unavailable on most desktop browsers,
 * and where it does exist its contents depend on what the visitor has
 * installed — so relying on it alone means the two channels that actually
 * matter here might simply not be offered. The native sheet is instead added as
 * one more entry when the browser supports it, which is what makes this feel
 * right on a phone.
 *
 * The URL is resolved on the client only. Reading `window.location` during
 * render would produce different markup on the server and the client, and React
 * would discard the hydrated tree.
 */
export function ShareButton({ title, url, compact = false }: ShareButtonProps): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);
  const [hasJustCopied, setHasJustCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setResolvedUrl(url ? new URL(url, origin).toString() : window.location.href);
    setCanUseNativeShare(typeof navigator.share === 'function');
  }, [url]);

  const shareText = `${title} — ${resolvedUrl}`;

  function close(): void {
    setAnchor(null);
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setHasJustCopied(true);
      notifySuccess('Link copied');
      // The tick is feedback, not a state change; it reverts on its own.
      window.setTimeout(() => setHasJustCopied(false), 2000);
    } catch {
      notifyError('Could not copy the link. Please copy it from the address bar.');
    }
    close();
  }

  async function handleNativeShare(): Promise<void> {
    close();
    try {
      await navigator.share({ title, url: resolvedUrl });
    } catch {
      // Dismissing the sheet rejects the promise. That is a choice, not a
      // failure, so it is deliberately silent.
    }
  }

  return (
    <>
      {compact ? (
        <Button
          size="small"
          variant="outlined"
          aria-label={`Share ${title}`}
          aria-haspopup="menu"
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ minWidth: 44, px: 1 }}
        >
          <ShareIcon fontSize="small" />
        </Button>
      ) : (
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          aria-haspopup="menu"
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          Share
        </Button>
      )}

      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: `${RADIUS.md}px`, minWidth: 220 } } }}
      >
        <MenuItem
          component="a"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
        >
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" sx={{ color: 'success.main' }} />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>

        <MenuItem
          component="a"
          href={`https://t.me/share/url?url=${encodeURIComponent(resolvedUrl)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
        >
          <ListItemIcon>
            <TelegramIcon fontSize="small" sx={{ color: 'info.main' }} />
          </ListItemIcon>
          <ListItemText>Telegram</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => void handleCopy()}>
          <ListItemIcon>
            {hasJustCopied ? (
              <CheckIcon fontSize="small" sx={{ color: 'success.main' }} />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>{hasJustCopied ? 'Copied' : 'Copy link'}</ListItemText>
        </MenuItem>

        {/* Offered only where the browser actually implements it — on a phone
            this is the entry that reaches Instagram, SMS, email and everything
            else the visitor has installed. */}
        {canUseNativeShare && (
          <MenuItem onClick={() => void handleNativeShare()}>
            <ListItemIcon>
              <IosShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>More options…</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
