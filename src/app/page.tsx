'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPreviewPage from './landing-preview/page';
import { getServerSupabase } from '@/lib/supabaseServer';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/lib/settings';

const LOCALES = ['pt', 'en'] as const;

function resolveLocaleFromAcceptLanguage(headerValue: string | null): 'pt' | 'en' {
  const header = headerValue?.toLowerCase() ?? '';
  if (header.startsWith('en')) return 'en';
  return 'pt';
}

function resolveLocaleFromCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): 'pt' | 'en' | null {
  const stored = cookieStore.get('app.locale')?.value ?? cookieStore.get(SETTINGS_KEY)?.value;
  if (stored?.toLowerCase().startsWith('en')) return 'en';
  if (stored?.toLowerCase().startsWith('pt')) return 'pt';
  return null;
}

function resolveDefaultLocale(): 'pt' | 'en' {
  const settingsLocale = DEFAULT_SETTINGS.locale?.toLowerCase?.() ?? '';
  if (settingsLocale.startsWith('en')) return 'en';
  return 'pt';
}

function resolveLocale(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  acceptLanguage: string | null,
): 'pt' | 'en' {
  return (
    resolveLocaleFromCookie(cookieStore) ??
    resolveLocaleFromAcceptLanguage(acceptLanguage) ??
    resolveDefaultLocale()
  );
}

async function fetchOnboardingFlag(userId: string): Promise<boolean | null> {
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase.from('users').select('*').eq('id', userId).limit(1).single();
    const flag =
      (data as Record<string, unknown> | null)?.['has-onboarding'] ??
      (data as Record<string, unknown> | null)?.['has_onboarding'];
    if (flag === true) return true;
    if (flag === false) return false;
  } catch {
    /* ignore server flag errors */
  }
  return null;
}

export default async function Home() {
  const cookieStore = await cookies();
  const acceptLanguage = (await headers()).get('accept-language');
  const locale = resolveLocale(cookieStore, acceptLanguage);
  let userId: string | null = null;

  try {
    const supabase = await getServerSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    userId = session?.user?.id ?? null;
    if (userId) {
      const remoteFlag = await fetchOnboardingFlag(userId);
      const needsOnboarding = remoteFlag !== true;
      redirect(`/${locale}/${needsOnboarding ? 'onboarding' : 'dashboard'}`);
    }
  } catch {
    // If Supabase is unavailable, fall back to showing the landing
  }

  return <LandingPreviewPage initialLang={LOCALES.includes(locale) ? locale : 'pt'} />;
}
