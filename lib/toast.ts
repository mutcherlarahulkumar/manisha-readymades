/**
 * Application-wide toast notifications.
 *
 * Every toast is emitted through this module so position, timing and wording
 * stay consistent; components never import `react-toastify` directly.
 *
 * @module lib/toast
 */
import { toast, type ToastOptions } from 'react-toastify';

import { HttpError } from '@/lib/http';

/** Shared options: top-left placement, as specified for this project. */
const BASE_OPTIONS: ToastOptions = {
  position: 'top-left',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  theme: 'light',
};

/**
 * Shows a success toast.
 *
 * @param message - Confirmation to display.
 */
export function notifySuccess(message: string): void {
  toast.success(message, BASE_OPTIONS);
}

/**
 * Shows an informational toast.
 *
 * @param message - Message to display.
 */
export function notifyInfo(message: string): void {
  toast.info(message, BASE_OPTIONS);
}

/**
 * Shows a warning toast.
 *
 * @param message - Message to display.
 */
export function notifyWarning(message: string): void {
  toast.warning(message, BASE_OPTIONS);
}

/**
 * Shows an error toast, extracting a readable message from any thrown value.
 *
 * Field-level validation errors are rendered by the form itself, so this
 * reports only the summary line.
 *
 * @param error - The thrown value, or a message string.
 * @param fallback - Message used when nothing readable can be extracted.
 */
export function notifyError(error: unknown, fallback = 'Something went wrong'): void {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof HttpError || error instanceof Error
        ? error.message
        : fallback;

  toast.error(message, { ...BASE_OPTIONS, autoClose: 6000 });
}
