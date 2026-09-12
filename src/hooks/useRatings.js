import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getRatingBreakdown } from "../utils/reputationHelpers";

/**
 * Fetches all ratings for a given user.
 */
export function useRatings(userId) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState({ 5:0, 4:0, 3:0, 2:0, 1:0 });
  const [averageScore, setAverageScore] = useState(0);

  const fetchRatings = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("ratings")
      .select(`*, rater:users!rater_id ( id, username, avatar_url )`)
      .eq("rated_user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRatings(data);
      setBreakdown(getRatingBreakdown(data));
      if (data.length > 0) {
        const avg = data.reduce((s, r) => s + r.score, 0) / data.length;
        setAverageScore(Math.round(avg * 10) / 10);
      }
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);
  return { ratings, loading, breakdown, averageScore };
}
