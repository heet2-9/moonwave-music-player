import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getEnvCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const configured = Boolean(
    url && 
    key && 
    url.length > 5 &&
    key.length > 10 &&
    !url.includes("your-supabase") &&
    !url.includes("your-project-id") &&
    url !== "https://your-supabase-project-id.supabase.co"
  );

  return { url, key, configured };
}

export function checkIsSupabaseConfigured(): boolean {
  return getEnvCredentials().configured;
}

export const isSupabaseConfigured = getEnvCredentials().configured;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, configured } = getEnvCredentials();

  if (!configured || !url || !key) {
    return null;
  }

  if (!supabaseInstance && typeof window !== "undefined") {
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}
