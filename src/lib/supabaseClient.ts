import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// We intentionally type as `any` to avoid strict generics issues in consumer code
// when Database types aren't provided. Runtime safety is enforced by Supabase.
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;
let supabase: any;

if (!supabaseUrl || !supabaseKey) {
  // During SSR/build, we don't want to crash the import if envs are not present.
  // Export a lightweight proxy that throws only if actually used server-side.
  if (typeof window === 'undefined') {
    supabase = new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase client not configured. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
          );
        },
      },
    ) as unknown as SupabaseBrowserClient;
  } else {
    // In the browser, fail fast so developers notice missing envs.
    throw new Error(
      'Missing Supabase configuration. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
} else {
  // Browser client that keeps auth cookies in sync with the server (middleware)
  supabase = createBrowserClient(supabaseUrl, supabaseKey) as unknown as any;
}

export { supabase };
