/**
 * Custom document that extracts Emotion's critical CSS during server rendering.
 *
 * @module pages/_document
 */
import type { EmotionCache } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import React from 'react';
import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from 'next/document';

import { createEmotionCache } from '@/lib/emotionCache';

/** Document shell for every page. */
export default class MyDocument extends Document {
  override render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#1F3A8A" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

/**
 * Renders the page with a request-scoped Emotion cache and inlines the styles
 * it produced into the document head.
 *
 * @param ctx - The Next.js document context.
 * @returns Document props including the extracted style tags.
 */
MyDocument.getInitialProps = async (ctx: DocumentContext): Promise<DocumentInitialProps> => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        function EnhanceApp(props) {
          // Next's `AppType` has no knowledge of the extra prop we inject, so
          // the component is re-typed here to accept the cache. It is threaded
          // through _app so the client and server render identical class names.
          const AppWithCache = App as unknown as React.ComponentType<
            typeof props & { emotionCache: EmotionCache }
          >;
          return <AppWithCache emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger -- Emotion's own generated CSS.
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags],
  };
};
