import { Roboto, Fredoka } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['400', '500', '700'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload local fonts to avoid layout shift when they load */}
        <link
          rel="preload"
          href="/fonts/Aptos-Light.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Aptos-SemiBold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${roboto.variable} ${fredoka.variable}`}>{children}</body>
    </html>
  );
}
