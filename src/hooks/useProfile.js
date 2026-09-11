import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * Fetches and manages the current user's public profile row.
 * Returns { profile, loading, error, updateProfile, refetch }
 */
export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Optimistically updates the profile and syncs to Supabase.
   * @param {object} updates - Partial fields to update
   * @returns {{ error: string | null }}
   */
  async function updateProfile(updates) {
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Optimistic update
    setProfile((prev) => ({ ...prev, ...updates }));

    const { data, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single();

    if (updateError) {
      // Rollback optimistic update
      await fetchProfile();
      return { error: updateError.message };
    }

    setProfile(data);
    return { error: null };
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
