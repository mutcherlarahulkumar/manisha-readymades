/**
 * Confirmation dialog for destructive actions.
 *
 * Deletions in the dashboard are irreversible, so every one of them routes
 * through this dialog rather than firing on a single click.
 *
 * @module components/common/ConfirmDialog
 */
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';

import { INNER_SPACING } from '@/theme/spacing';

/** Props for {@link ConfirmDialog}. */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** What will happen, stated plainly. */
  message: string;
  confirmLabel?: string;
  /** Runs the action; the dialog stays open and disabled until it settles. */
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

/**
 * Asks the admin to confirm before an irreversible action proceeds.
 *
 * @param props - Dialog content and handlers.
 * @returns The dialog element.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  const [isWorking, setIsWorking] = useState(false);

  async function handleConfirm(): Promise<void> {
    setIsWorking(true);
    try {
      await onConfirm();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Dialog open={open} onClose={isWorking ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: INNER_SPACING }}>
        <Button onClick={onCancel} disabled={isWorking}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" disabled={isWorking}>
          {isWorking ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
