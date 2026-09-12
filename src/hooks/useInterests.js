import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches all interests for a post (for post owners).
 * Provides acceptInterest and rejectInterest actions.
 * @param {string} postId
 * @param {string} ownerId  - current user id (post owner)
 */
export function useInterests(postId, ownerId) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const fetchInterests = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("interests")
      .select(`
        *,
        users!from_user_id ( id, username, avatar_url, college, reputation_score )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) setInterests(data);
    setLoading(false);
  }, [postId]);

  // Realtime — new interests arrive live
  useEffect(() => {
    if (!postId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`interests-${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interests", filter: `post_id=eq.${postId}` },
        async () => { await fetchInterests(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interests", filter: `post_id=eq.${postId}` },
        async () => { await fetchInterests(); }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [postId, fetchInterests]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  /**
   * Accept an interest: update status, create conversation, mark post claimed.
   * @returns {{ conversationId: string|null, error: string|null }}
   */
  const acceptInterest = useCallback(async (interestId, fromUserId) => {
    // 1. Mark interest accepted
    const { error: intErr } = await supabase
      .from("interests")
      .update({ status: "accepted" })
      .eq("id", interestId);
    if (intErr) return { conversationId: null, error: intErr.message };

    // 2. Create conversation
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .upsert(
        { post_id: postId, user_a_id: ownerId, user_b_id: fromUserId },
        { onConflict: "post_id,user_a_id,user_b_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();
    if (convErr) return { conversationId: null, error: convErr.message };

    // 3. Mark post claimed
    await supabase.from("posts").update({ status: "claimed" }).eq("id", postId);

    // Optimistic local update
    setInterests((prev) =>
      prev.map((i) => (i.id === interestId ? { ...i, status: "accepted" } : i))
    );

    return { conversationId: conv.id, error: null };
  }, [postId, ownerId]);

  const rejectInterest = useCallback(async (interestId) => {
    const { error } = await supabase
      .from("interests")
      .update({ status: "rejected" })
      .eq("id", interestId);
    if (!error) {
      setInterests((prev) =>
        prev.map((i) => (i.id === interestId ? { ...i, status: "rejected" } : i))
      );
    }
    return { error: error?.message ?? null };
  }, []);

  return { interests, loading, fetchInterests, acceptInterest, rejectInterest };
}
