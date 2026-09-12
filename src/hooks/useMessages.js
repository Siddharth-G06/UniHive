import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches, sends and subscribes to messages in a conversation.
 * Handles optimistic UI and read receipts.
 */
export function useMessages(conversationId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // ── Fetch all messages ──────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select(`*, sender:users!sender_id ( id, username, avatar_url )`)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data);
    setLoading(false);
  }, [conversationId]);

  // ── Mark messages from other user as read ───────────────────
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);
  }, [conversationId, currentUserId]);

  // ── Realtime subscription ───────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          // Deduplicate — optimistic message already in state with temp id
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Remove matching optimistic message (same content + sender)
            const withoutOptimistic = prev.filter(
              (m) => !(m._optimistic && m.content === newMsg.content && m.sender_id === newMsg.sender_id)
            );
            // Fetch full message with sender info
            supabase
              .from("messages")
              .select(`*, sender:users!sender_id ( id, username, avatar_url )`)
              .eq("id", newMsg.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setMessages((cur) => {
                    if (cur.some((m) => m.id === data.id)) return cur;
                    const clean = cur.filter(
                      (m) => !(m._optimistic && m.content === data.content && m.sender_id === data.sender_id)
                    );
                    return [...clean, data];
                  });
                }
              });
            return withoutOptimistic;
          });

          // Mark as read if it is from the other user
          if (newMsg.sender_id !== currentUserId) {
            await markAsRead();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, markAsRead]);

  // ── On mount: fetch + mark read ────────────────────────────
  useEffect(() => {
    fetchMessages().then(() => markAsRead());
  }, [fetchMessages, markAsRead]);

  // ── Send message ────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !conversationId || !currentUserId) return;

    const tempId = `opt-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
      _optimistic: true,
      _failed: false,
      sender: null,
    };

    // Optimistic add
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
      })
      .select(`*, sender:users!sender_id ( id, username, avatar_url )`)
      .single();

    if (error) {
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, _failed: true } : m))
      );
      console.error("Send message error:", error);
    } else {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempId)
          .concat(prev.some((m) => m.id === data.id) ? [] : [data])
      );
    }
  }, [conversationId, currentUserId]);

  return { messages, loading, sendMessage, markAsRead };
}
