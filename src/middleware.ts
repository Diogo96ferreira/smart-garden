import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const LOCALES = ['pt', 'en'] as const;
const SECTIONS = [
  'dashboard',
  'garden',
  'settings',
  'calendar',
  'ai',
  'onboarding',
  'reports',
] as const;
const PROTECTED_PREFIXES = LOCALES.flatMap((l) => SECTIONS.map((s) => `/${l}/${s}`));

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
    const dest = `${url.pathname}${url.search ?? ''}`;
    const signin = req.nextUrl.clone();
    signin.pathname = '/signin';
    // Pass raw destination; client decodes if necessary
    signin.searchParams.set('next', dest);
    return NextResponse.redirect(signin);
  }

  return res;
}

export const config = {
  matcher: ['/pt/:path*', '/en/:path*'],
};
