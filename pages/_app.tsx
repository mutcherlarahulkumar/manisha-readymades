/**
 * Application root: theme, Emotion cache, auth context and toast container.
 *
 * @module pages/_app
 */
import { CacheProvider, type EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LazyMotion, domAnimation } from 'framer-motion';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';

import { PageTransition } from '@/components/motion/PageTransition';
import { AuthProvider } from '@/hooks/useAuth';
import { createEmotionCache } from '@/lib/emotionCache';
import { theme } from '@/theme';

import 'react-toastify/dist/ReactToastify.css';

/** Cache shared by every client-side render. */
const clientSideEmotionCache = createEmotionCache();

/** Props for the app, including the server-supplied Emotion cache. */
interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

/**
 * Wraps every page in the shared providers.
 *
 * @param props - Next.js app props plus the Emotion cache.
 * @returns The application tree.
 */
export default function MyApp({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: MyAppProps): JSX.Element {
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/*
          Only the animation and gesture feature bundles are loaded, which is
          roughly half of what importing the full `motion` component would pull
          into the shared chunk. `strict` makes that saving enforceable: it
          throws if any component reaches for `motion` instead of `m`, so the
          full bundle cannot creep back in unnoticed. `domAnimation` covers
          variants, `whileInView` and hover/tap — everything this UI animates.
        */}
        <LazyMotion features={domAnimation} strict>
          <AuthProvider>
            <PageTransition>
              <Component {...pageProps} />
            </PageTransition>
          </AuthProvider>
        </LazyMotion>
        {/* Position is fixed here and in lib/toast so every toast agrees. */}
        <ToastContainer position="top-left" newestOnTop limit={3} />
      </ThemeProvider>
    </CacheProvider>
  );
}
