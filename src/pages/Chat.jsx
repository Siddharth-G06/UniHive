import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { useConversations } from "../hooks/useConversations";
import MessageBubble from "../components/MessageBubble";
import ConversationItem from "../components/ConversationItem";
import LoadingSpinner from "../components/LoadingSpinner";
import MessageSkeleton from "../components/MessageSkeleton";
import "../styles/chat.css";

const POST_ROUTE = { lost: "/posts", found: "/posts", request: "/exchange", offer: "/exchange" };

function dateSeparatorLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}

function isGrouped(messages, idx) {
  if (idx === 0) return false;
  const cur = messages[idx];
  const prev = messages[idx - 1];
  if (cur.sender_id !== prev.sender_id) return false;
  const diff = new Date(cur.created_at) - new Date(prev.created_at);
  return diff < 3 * 60 * 1000; // within 3 minutes
}

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conv, setConv] = useState(null);
  const [convLoading, setConvLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const lastScrolledId = useRef(null);

  const { messages, loading: msgsLoading, sendMessage } = useMessages(conversationId, user?.id);
  const { conversations, totalUnread } = useConversations(user?.id);

  // ── Fetch conversation details ──────────────────────────────
  useEffect(() => {
    async function load() {
      setConvLoading(true);
      const { data } = await supabase
        .from("conversations")
        .select(`
          *,
          post:post_id ( id, title, type, status, category ),
          user_a:users!user_a_id ( id, username, avatar_url, college ),
          user_b:users!user_b_id ( id, username, avatar_url, college )
        `)
        .eq("id", conversationId)
        .single();

      if (data) {
        const isA = data.user_a_id === user?.id;
        setConv({ ...data, otherUser: isA ? data.user_b : data.user_a });
      }
      setConvLoading(false);
    }
    if (conversationId) load();
  }, [conversationId, user?.id]);

  // ── Auto-scroll ─────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Instant scroll on mount
  useEffect(() => {
    if (!msgsLoading && messages.length > 0) scrollToBottom("instant");
  }, [msgsLoading]);

  // Smooth scroll on new messages (only if recent)
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id === lastScrolledId.current) return;
    lastScrolledId.current = last.id;
    const age = Date.now() - new Date(last.created_at).getTime();
    if (age < 5000 || last._optimistic) scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  // ── Auto-resize textarea ────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // ── Send handler ────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await sendMessage(text);
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const otherUser = conv?.otherUser;
  const post = conv?.post;
  const charCount = input.length;
  const overLimit = charCount > 500;

  return (
    <div className="chat-root" id="chat-page">
      {/* ── Sidebar (conversations) ── */}
      <aside className="conv-sidebar conv-sidebar-narrow">
        <div className="conv-sidebar-header">
          <h2 className="conv-sidebar-title" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare size={16} /> Messages
            {totalUnread > 0 && <span className="conv-total-unread">{totalUnread}</span>}
          </h2>
        </div>
        <div className="conv-list">
          {conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === conversationId}
              currentUserId={user?.id}
              onClick={() => navigate(`/messages/${c.id}`)}
            />
          ))}
        </div>
      </aside>

      {/* ── Chat panel ── */}
      <div className="chat-panel">
        {/* Header */}
        <div className="chat-header">
          <button
            className="chat-back-btn"
            onClick={() => navigate("/messages")}
            aria-label="Back to messages"
          >
            <ArrowLeft size={20} />
          </button>

          {convLoading ? (
            <div className="chat-header-user">
              <div className="chat-header-skeleton" />
            </div>
          ) : (
            <div className="chat-header-user">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt={otherUser.username} className="chat-header-avatar" />
              ) : (
                <span className="chat-header-avatar chat-header-avatar-initials">
                  {(otherUser?.username ?? "U")[0].toUpperCase()}
                </span>
              )}
              <div>
                <p className="chat-header-name">@{otherUser?.username ?? "—"}</p>
                {post && (
                  <button
                    className="chat-post-pill"
                    onClick={() => navigate(`${POST_ROUTE[post.type] ?? "/posts"}/${post.id}`)}
                  >
                    Re: {post.title}
                    {post.status === "resolved" && (
                      <span className="chat-resolved-badge" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <CheckCircle2 size={11} /> Resolved
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="chat-messages" id="chat-messages-area">
          {msgsLoading && <MessageSkeleton />}

          {!msgsLoading && messages.length === 0 && (
            <div className="chat-no-messages">
              <p>No messages yet. Send a message to get started!</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const showSeparator = idx === 0 || !isSameDay(messages[idx - 1].created_at, msg.created_at);
            const grouped = isGrouped(messages, idx);
            const isOwn = msg.sender_id === user?.id;

            return (
              <div key={msg.id}>
                {showSeparator && (
                  <div className="date-separator" aria-label={dateSeparatorLabel(msg.created_at)}>
                    <span>{dateSeparatorLabel(msg.created_at)}</span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  isGrouped={grouped}
                />
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          {overLimit && (
            <p className="chat-char-warning">{charCount}/500 — message too long</p>
          )}
          <div className="chat-input-row">
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="chat-textarea"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={600}
              aria-label="Message input"
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || overLimit || sending}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
