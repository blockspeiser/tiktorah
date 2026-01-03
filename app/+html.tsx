import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Primary Meta Tags */}
        <title>TikTorah</title>
        <meta name="title" content="TikTorah" />
        <meta name="description" content="Swipe through Jewish wisdom, one card at a time" />

        {/* Open Graph / Facebook / LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TikTorah" />
        <meta property="og:description" content="Swipe through Jewish wisdom, one card at a time" />
        <meta property="og:image" content="/social.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TikTorah" />
        <meta name="twitter:description" content="Swipe through Jewish wisdom, one card at a time" />
        <meta name="twitter:image" content="/social.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
