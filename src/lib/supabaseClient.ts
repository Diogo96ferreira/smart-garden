import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// We intentionally type as `any` to avoid strict generics issues in consumer code
// when Database types aren't provided. Runtime safety is enforced by Supabase.
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;
let supabase: any;

if (!supabaseUrl || !supabaseKey) {
  // Do not crash import; expose a proxy that throws on use with a clear message
  const message =
    'Supabase client not configured. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

  supabase = new Proxy(
    {},
    {
      get() {
        // Surface as runtime error when actually used
        throw new Error(message);
      },
    },
  ) as unknown as SupabaseBrowserClient;
  if (typeof window !== 'undefined') {
    // Help developers notice in browser without breaking import

    console.error(message);
  }
} else {
  // Browser client that keeps auth cookies in sync with the server (middleware)
  supabase = createBrowserClient(supabaseUrl, supabaseKey) as unknown as any;
}

export { supabase };
