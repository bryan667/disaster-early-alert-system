import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __deasSupabaseAdmin: SupabaseClient | undefined;
}

export function getSupabaseAdmin() {
  if (global.__deasSupabaseAdmin) {
    return global.__deasSupabaseAdmin;
  }

  const client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    global.__deasSupabaseAdmin = client;
  }

  return client;
}
