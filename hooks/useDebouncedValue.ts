/**
 * Value debouncing.
 *
 * @module hooks/useDebouncedValue
 */
import { useEffect, useState } from 'react';

/**
 * Returns a copy of a value that only updates once it has stopped changing.
 *
 * Used for search boxes so a request is not issued on every keystroke.
 *
 * @typeParam TValue - The value's type.
 * @param value - The value to debounce.
 * @param delayMs - Quiet period before the value is published.
 * @returns The debounced value.
 *
 * @example
 * ```ts
 * const debouncedSearch = useDebouncedValue(search, 400);
 * ```
 */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 300): TValue {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
