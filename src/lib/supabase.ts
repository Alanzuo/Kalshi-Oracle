// src/lib/supabase.ts — typed Supabase client factory.
// Uses the anon key (RLS allows public SELECT on cc_* tables).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});
