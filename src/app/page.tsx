'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPreviewPage from './landing-preview/page';
import { getServerSupabase } from '@/lib/supabaseServer';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/lib/settings';

const LOCALES = ['pt', 'en'] as const;

function resolveLocaleFromAcceptLanguage(): 'pt' | 'en' {
  const header = headers().get('accept-language')?.toLowerCase() ?? '';
  if (header.startsWith('en')) return 'en';
  return 'pt';
}

function resolveLocaleFromCookie(): 'pt' | 'en' | null {
  const store = cookies();
  const stored = store.get('app.locale')?.value ?? store.get(SETTINGS_KEY)?.value;
  if (stored?.toLowerCase().startsWith('en')) return 'en';
  if (stored?.toLowerCase().startsWith('pt')) return 'pt';
  return null;
}

function resolveDefaultLocale(): 'pt' | 'en' {
  const settingsLocale = DEFAULT_SETTINGS.locale?.toLowerCase?.() ?? '';
  if (settingsLocale.startsWith('en')) return 'en';
  return 'pt';
}

function resolveLocale(): 'pt' | 'en' {
  return resolveLocaleFromCookie() ?? resolveLocaleFromAcceptLanguage() ?? resolveDefaultLocale();
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
  const locale = resolveLocale();
  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  const hasSession = Boolean(userId);

  if (hasSession) {
    const remoteFlag = userId ? await fetchOnboardingFlag(userId) : null;
    const needsOnboarding = remoteFlag !== true;
    redirect(`/${locale}/${needsOnboarding ? 'onboarding' : 'dashboard'}`);
  }

  // No session: render landing
  if (!LOCALES.includes(locale)) {
    redirect('/pt'); // fallback
  }
  return <LandingPreviewPage />;
}
