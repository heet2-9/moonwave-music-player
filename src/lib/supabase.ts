import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "https://your-supabase-project-id.supabase.co" &&
  !supabaseUrl.includes("your-supabase")
);

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured && typeof window !== "undefined") {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient && isSupabaseConfigured && typeof window !== "undefined") {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseClient;
}
