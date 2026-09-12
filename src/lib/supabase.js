import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TODO: REMOVE gmail.com before deployment
export const ALLOWED_DOMAINS = [
  'ssn.edu.in',
  'snu.edu.in',
  'gmail.com'  // TESTING ONLY — DELETE THIS LINE
]

/**
 * Returns true if the given email belongs to an allowed college domain.
 * @param {string} email
 * @returns {boolean}
 */
export function isCollegeEmail(email) {
  if (!email || typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  return ALLOWED_DOMAINS.includes(parts[1]);
}
