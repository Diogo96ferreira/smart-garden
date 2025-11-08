import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PROTECTED_PREFIXES = [
  '/pt/dashboard',
  '/pt/garden',
  '/pt/settings',
  '/pt/calendar',
  '/pt/ai',
  '/pt/onboarding',
  '/pt/reports',
  '/en/dashboard',
  '/en/garden',
  '/en/settings',
  '/en/calendar',
  '/en/ai',
  '/en/onboarding',
  '/en/reports',
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isProtected = PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const res = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const locale = url.pathname.split('/')[1] === 'en' ? 'en' : 'pt';
    url.pathname = '/signin';
    url.searchParams.set('next', `/${locale}/dashboard`);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/pt/:path*', '/en/:path*'],
};
