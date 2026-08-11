/**
 * Loading, error and empty states.
 *
 * Every data-driven view routes through {@link AsyncState} so the three
 * conditions are handled the same way and none is quietly forgotten.
 *
 * @module components/common/StateViews
 */
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';

/** Props for {@link LoadingState}. */
interface LoadingStateProps {
  /** Message shown beneath the spinner. */
  label?: string;
  /** Render placeholder cards instead of a spinner, for grid layouts. */
  variant?: 'spinner' | 'skeleton';
  /** Number of skeleton placeholders to draw. */
  skeletonCount?: number;
}

/**
 * Indicates that data is being fetched.
 *
 * @param props - Presentation options.
 * @returns The loading element.
 */
export function LoadingState({
  label = 'Loading…',
  variant = 'spinner',
  skeletonCount = 6,
}: LoadingStateProps): JSX.Element {
  if (variant === 'skeleton') {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: OUTER_SPACING,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <Box key={index}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
            <Skeleton width="70%" sx={{ mt: 1 }} />
            <Skeleton width="40%" />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stack alignItems="center" spacing={INNER_SPACING} sx={{ py: 6 }} role="status">
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

/** Props for {@link ErrorState}. */
interface ErrorStateProps {
  /** Message describing what failed, taken from the server where possible. */
  message: string;
  /** Invoked when the visitor chooses to retry. */
  onRetry?: () => void;
}

/**
 * Reports a failed request and offers a retry.
 *
 * @param props - Error message and retry handler.
 * @returns The error element.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <Alert
      severity="error"
      sx={{ my: OUTER_SPACING }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>Something went wrong</AlertTitle>
      {message}
    </Alert>
  );
}

/** Props for {@link EmptyState}. */
interface EmptyStateProps {
  /** Short statement of what is missing. */
  title: string;
  /** Guidance on how to populate the view. */
  description?: string;
  /** A primary action, such as "Add product". */
  action?: ReactNode;
  /** Illustrative icon. */
  icon?: ReactNode;
}

/**
 * Explains that a successful request returned nothing, and what to do about it.
 *
 * @param props - Message and optional call to action.
 * @returns The empty-state element.
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps): JSX.Element {
  return (
    <Stack
      alignItems="center"
      spacing={INNER_SPACING}
      sx={{
        py: 6,
        px: OUTER_SPACING,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      {icon}
      <Typography variant="h5">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}

/** Props for {@link AsyncState}. */
interface AsyncStateProps {
  isLoading: boolean;
  /** Any thrown value from the data layer; `undefined` when the request succeeded. */
  error: unknown;
  /** True when the request succeeded but returned no rows. */
  isEmpty: boolean;
  /** Rendered when data is present. */
  children: ReactNode;
  /** Retry handler passed to the error state. */
  onRetry?: () => void;
  /** Overrides for the empty state's wording and action. */
  empty?: EmptyStateProps;
  loadingVariant?: LoadingStateProps['variant'];
}

/**
 * Renders exactly one of the loading, error, empty or success states.
 *
 * @param props - The current request state and the success content.
 * @returns The state-appropriate element.
 *
 * @example
 * ```tsx
 * <AsyncState
 *   isLoading={isLoading}
 *   error={error}
 *   isEmpty={products.length === 0}
 *   empty={{ title: 'No products yet' }}
 * >
 *   <ProductGrid products={products} />
 * </AsyncState>
 * ```
 */
export function AsyncState({
  isLoading,
  error,
  isEmpty,
  children,
  onRetry,
  empty,
  loadingVariant = 'spinner',
}: AsyncStateProps): JSX.Element {
  if (isLoading) return <LoadingState variant={loadingVariant} />;

  if (error) {
    const message = error instanceof Error ? error.message : 'Unable to load this content.';
    return <ErrorState message={message} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <EmptyState title={empty?.title ?? 'Nothing to show yet'} {...empty} />;
  }

  return <>{children}</>;
}
