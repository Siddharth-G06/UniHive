import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches all conversations for the current user, with last message
 * preview, unread count, and realtime updates.
 */
export function useConversations(currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const channelRef = useRef(null);

  const buildConversation = useCallback(async (raw, currentUserId) => {
    const isA = raw.user_a_id === currentUserId;
    const otherUser = isA ? raw.user_b : raw.user_a;

    // Last message
    const { data: lastMsgArr } = await supabase
      .from("messages")
      .select("id, content, sender_id, created_at, read_at")
      .eq("conversation_id", raw.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const lastMsg = lastMsgArr?.[0] ?? null;

    // Unread count (messages from OTHER user that have no read_at)
    const { count: unreadCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", raw.id)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    return {
      ...raw,
      otherUser,
      lastMsg,
      unreadCount: unreadCount ?? 0,
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data: rawConvs, error } = await supabase
      .from("conversations")
      .select(`
        *,
        post:post_id ( id, title, type, status, category ),
        user_a:users!user_a_id ( id, username, avatar_url, college ),
        user_b:users!user_b_id ( id, username, avatar_url, college )
      `)
      .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (error) { console.error("Conversations fetch error:", error); setLoading(false); return; }

    const enriched = await Promise.all(
      (rawConvs ?? []).map((c) => buildConversation(c, currentUserId))
    );

    // Sort by last message time (newest first)
    enriched.sort((a, b) => {
      const ta = a.lastMsg?.created_at ?? a.created_at;
      const tb = b.lastMsg?.created_at ?? b.created_at;
      return new Date(tb) - new Date(ta);
    });

    setConversations(enriched);
    setTotalUnread(enriched.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0));
    setLoading(false);
  }, [currentUserId, buildConversation]);

  // Realtime: re-fetch when a new message arrives for any conversation
  useEffect(() => {
    if (!currentUserId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`convs-${currentUserId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async () => { await fetchConversations(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        async () => { await fetchConversations(); }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, fetchConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return { conversations, loading, totalUnread, refetch: fetchConversations };
}
