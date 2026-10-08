import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient } from "@/app/lib/utils/supabaseClient";

let cachedServerClient: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client equipped with the service role key if available,
 * allowing server-side analytics aggregation and caching without RLS blocking.
 * Falls back to the default client when service key is not configured.
 */
export function getDbClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    if (!cachedServerClient) {
      cachedServerClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "braindance-server-admin-auth",
        },
      });
    }
    return cachedServerClient;
  }

  return defaultClient;
}
