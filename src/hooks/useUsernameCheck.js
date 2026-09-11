import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Debounced username availability check.
 * Skips check if username < 3 chars or unchanged from currentUsername.
 * @param {string} username
 * @param {string} [currentUsername] - current user's own username (skip check if unchanged)
 * @returns {{ available: boolean | null, checking: boolean }}
 */
export function useUsernameCheck(username, currentUsername = "") {
  const [available, setAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Reset when username is too short
    if (!username || username.length < 3) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    // Skip check if user hasn't changed their own username
    if (username === currentUsername) {
      setAvailable(true);
      setChecking(false);
      return;
    }

    setChecking(true);
    setAvailable(null);

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        // On error, treat as unknown — don't block user
        setAvailable(null);
      } else {
        setAvailable(data === null); // null means no row found → available
      }
      setChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, currentUsername]);

  return { available, checking };
}
