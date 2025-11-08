// src/app/[locale]/layout.tsx
import LocaleLayoutClient from './LocaleLayoutClient';

type LocaleParams = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export default async function LocaleLayout({ children, params }: LocaleParams) {
  const { locale } = await params;
  const normLocale = locale === 'en' ? 'en' : 'pt';

  return <LocaleLayoutClient locale={normLocale}>{children}</LocaleLayoutClient>;
}
