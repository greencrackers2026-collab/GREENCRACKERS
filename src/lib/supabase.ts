import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Supabase now calls this the publishable key; older projects call it the anon key. Either works.
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the env vars are missing; the app then shows setup instructions instead of crashing. */
export const supabaseConfigured = Boolean(url && anonKey);

// The anon key is public by design. Row Level Security and the SQL functions in supabase/schema.sql protect the data.
export const supabase = createClient(url || "http://localhost:54321", anonKey || "missing-anon-key");

/** Turns a Supabase/PostgREST error into a message that is safe to show. Raised SQL exceptions carry our own wording. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string" && e.message) {
    if (/fetch|network/i.test(e.message)) return "Network error. Please check your connection and try again.";
    return e.message;
  }
  return fallback;
}
