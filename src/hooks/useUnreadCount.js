import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Lightweight hook for Navbar only — just the total unread count.
 * Does NOT duplicate the heavy useConversations subscription.
 */
export function useUnreadCount(currentUserId) {
  const [totalUnread, setTotalUnread] = useState(0);
  const channelRef = useRef(null);

  async function fetchCount(userId) {
    if (!userId) { setTotalUnread(0); return; }
    // Get all conversation IDs for this user
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (!convs || convs.length === 0) { setTotalUnread(0); return; }

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convs.map((c) => c.id))
      .neq("sender_id", userId)
      .is("read_at", null);

    setTotalUnread(count ?? 0);
  }

  useEffect(() => {
    fetchCount(currentUserId);
  }, [currentUserId]);

  // Realtime: bump count on new messages
  useEffect(() => {
    if (!currentUserId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`unread-badge-${currentUserId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchCount(currentUserId)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => fetchCount(currentUserId)
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return totalUnread;
}
