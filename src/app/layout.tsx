import type { Metadata } from 'next';
import { Roboto, Playfair_Display } from 'next/font/google';
import './globals.css';

// Fonte principal para texto (body)
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

// Fonte para títulos (headings)
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Smart Garden',
  description: 'AI-powered garden management app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${playfair.variable} font-body bg-white text-gray-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
