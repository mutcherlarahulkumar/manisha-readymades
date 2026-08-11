/**
 * Client-side analytics tracking.
 *
 * Calls are fire-and-forget: a tracking failure must never surface to a visitor
 * or block navigation, so errors are swallowed deliberately.
 *
 * @module lib/analytics
 */
import { api } from '@/lib/http';
import type { EventType } from '@/types/models';

/**
 * Records a storefront interaction.
 *
 * @param type - The interaction kind.
 * @param productId - The product involved, when applicable.
 *
 * @example
 * ```ts
 * trackEvent('whatsapp_click', product._id);
 * ```
 */
export function trackEvent(type: EventType, productId: string | null = null): void {
  void api('/api/events', {
    method: 'POST',
    body: { type, product: productId },
    anonymous: true,
  }).catch(() => {
    // Intentionally ignored — analytics must never disrupt browsing.
  });
}
