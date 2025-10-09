import { Roboto, Fredoka } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
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
      <body className={`${roboto.variable} ${fredoka.variable}`}>{children}</body>
    </html>
  );
}
