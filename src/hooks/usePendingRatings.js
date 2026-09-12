import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const SKIP_KEY = "skipped_ratings";
function getSkipped() {
  try { return JSON.parse(localStorage.getItem(SKIP_KEY) ?? "[]"); }
  catch { return []; }
}
export function addSkipped(postId) {
  const arr = getSkipped();
  if (!arr.includes(postId)) arr.push(postId);
  localStorage.setItem(SKIP_KEY, JSON.stringify(arr));
}

/**
 * Find resolved posts where current user was involved (via conversation)
 * but hasn't rated yet and hasn't skipped.
 */
export function usePendingRatings(currentUserId) {
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!currentUserId) { setLoading(false); return; }
    setLoading(true);

    // 1. Get all conversations this user is in
    const { data: convs } = await supabase
      .from("conversations")
      .select(`
        id, post_id,
        post:post_id ( id, title, type, status, category ),
        user_a:users!user_a_id ( id, username, avatar_url ),
        user_b:users!user_b_id ( id, username, avatar_url )
      `)
      .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`);

    if (!convs) { setLoading(false); return; }

    // 2. Filter: resolved posts only
    const resolved = convs.filter((c) => c.post?.status === "resolved");

    // 3. Exclude skipped
    const skipped = getSkipped();
    const notSkipped = resolved.filter((c) => !skipped.includes(c.post_id));

    if (notSkipped.length === 0) { setPendingRatings([]); setLoading(false); return; }

    // 4. Check which ones the user has already rated
    const { data: existingRatings } = await supabase
      .from("ratings")
      .select("post_id")
      .eq("rater_id", currentUserId)
      .in("post_id", notSkipped.map((c) => c.post_id));

    const ratedPostIds = new Set((existingRatings ?? []).map((r) => r.post_id));

    // 5. Build pending list
    const pending = notSkipped
      .filter((c) => !ratedPostIds.has(c.post_id))
      .map((c) => {
        const isA = c.user_a?.id === currentUserId;
        const otherUser = isA ? c.user_b : c.user_a;
        return { conversationId: c.id, post: c.post, otherUser };
      });

    setPendingRatings(pending);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  return { pendingRatings, loading, refetch: fetchPending };
}
