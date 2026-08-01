import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    global: {
      // Next.js App Router caches fetch by default — empty RLS responses
      // would stick forever without no-store.
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  });
}

/** Browser & Server — anon key only, always fresh */
export const supabase = createSupabaseClient();
