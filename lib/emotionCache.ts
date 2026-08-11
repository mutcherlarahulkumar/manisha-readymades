/**
 * Emotion cache used by both the client and the server renderer, so MUI's
 * styles are emitted during SSR and there is no flash of unstyled content.
 *
 * @module lib/emotionCache
 */
import createCache, { type EmotionCache } from '@emotion/cache';

/**
 * Creates an Emotion cache keyed for MUI.
 *
 * @returns A cache whose styles are prepended, letting plain CSS overrides win
 *   over MUI's generated classes.
 */
export function createEmotionCache(): EmotionCache {
  return createCache({ key: 'mui', prepend: true });
}
