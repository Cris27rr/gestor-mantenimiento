import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Vite standard (VITE_*) with legacy EXPO_PUBLIC_* fallback for old .env files */
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  "";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
