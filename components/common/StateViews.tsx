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
import { RADIUS, SURFACE } from '@/theme/tokens';

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
      // The columns, gutters and card proportions deliberately mirror
      // `ProductGrid`. When they did not, every load visibly reflowed as the
      // placeholders were replaced by real cards — the placeholder's whole job
      // is to reserve the space the content will occupy.
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 3 },
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
        }}
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <Box
            key={index}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${RADIUS.md}px`,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Skeleton variant="rectangular" sx={{ aspectRatio: '3 / 4', borderRadius: 0 }} />
            <Box sx={{ p: INNER_SPACING }}>
              <Skeleton width="45%" height={12} />
              <Skeleton width="90%" height={16} sx={{ mt: 0.75 }} />
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stack alignItems="center" spacing={INNER_SPACING} sx={{ py: 8 }} role="status">
      <CircularProgress size={28} thickness={4} />
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
      spacing={1.5}
      sx={{
        py: { xs: 6, md: 8 },
        px: OUTER_SPACING,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: SURFACE.borderStrong,
        borderRadius: `${RADIUS.md}px`,
        bgcolor: 'background.paper',
      }}
    >
      {icon}
      <Typography variant="h5" component="p">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '46ch' }}>
          {description}
        </Typography>
      )}
      {/* The action sits on its own line with clear separation: an empty state
          exists to offer a way out, and the way out should not read as a
          footnote to the explanation. */}
      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
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
