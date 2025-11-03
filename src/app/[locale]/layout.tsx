import { ReactNode } from 'react';
import LocaleLayoutClient from './LocaleLayoutClient';

type LocaleParams = {
  children: ReactNode;
  params: { locale: string };
};

export default function LocaleLayout({ children, params }: LocaleParams) {
  const locale = params.locale === 'en' ? 'en' : 'pt';
  return <LocaleLayoutClient locale={locale}>{children}</LocaleLayoutClient>;
}

export function generateStaticParams() {
  return [{ locale: 'pt' }, { locale: 'en' }];
}
