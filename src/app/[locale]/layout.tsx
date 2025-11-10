// src/app/[locale]/layout.tsx
import LocaleLayoutClient from './LocaleLayoutClient';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normLocale = locale === 'en' ? 'en' : 'pt';
  return <LocaleLayoutClient locale={normLocale}>{children}</LocaleLayoutClient>;
}
