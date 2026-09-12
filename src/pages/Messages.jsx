import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare, MessageCircle, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../hooks/useConversations";
import { usePendingRatings } from "../hooks/usePendingRatings";
import ConversationItem from "../components/ConversationItem";
import RatingModal from "../components/RatingModal";
import "../styles/chat.css";
import "../styles/ratings.css";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId: activeId } = useParams();
  const { conversations, loading, totalUnread } = useConversations(user?.id);
  const { pendingRatings, refetch: refetchPending } = usePendingRatings(user?.id);
  const [ratingModal, setRatingModal] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  return (
    <main className="messages-page" id="messages-page">
      <div className="messages-layout">
        {/* Sidebar — conversation list */}
        <aside className="conv-sidebar">
          <div className="conv-sidebar-header">
            <h1 className="conv-sidebar-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={20} />
              <span>Messages</span>
              {totalUnread > 0 && <span className="conv-total-unread">{totalUnread}</span>}
            </h1>
          </div>

          {/* Pending ratings banner */}
          {pendingRatings.length > 0 && (
            <div className="pending-rating-banner" style={{ margin: "10px 12px 0", borderRadius: "8px" }}>
              <p className="pending-banner-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span>{pendingRatings.length} pending rating{pendingRatings.length > 1 ? "s" : ""}</span>
              </p>
              {pendingRatings.map((pr) => (
                <div key={pr.conversationId} className="pending-item">
                  <div className="pending-item-info">
                    <p className="pending-item-user">@{pr.otherUser?.username}</p>
                    <p className="pending-item-post">{pr.post?.title}</p>
                  </div>
                  <button
                    className="btn-rate-now"
                    onClick={() => setRatingModal({
                      postId: pr.post.id,
                      postTitle: pr.post.title,
                      ratedUserId: pr.otherUser.id,
                      ratedUsername: pr.otherUser.username,
                    })}
                  >
                    <Star size={12} fill="currentColor" /> Rate
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="conv-list" role="list">
            {loading && (
              <div className="conv-skeletons">
                {[1, 2, 3].map((i) => <div key={i} className="conv-skeleton" />)}
              </div>
            )}

            {!loading && conversations.length === 0 && pendingRatings.length === 0 && (
              <div className="conv-empty">
                <div className="conv-empty-icon" style={{ display: "flex", justifyContent: "center" }}>
                  <MessageCircle size={40} color="var(--text-muted)" />
                </div>
                <p className="conv-empty-title">No conversations yet</p>
                <p className="conv-empty-desc">Express interest in a post to start chatting with campus peers!</p>
              </div>
            )}

            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                currentUserId={user?.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
              />
            ))}
          </div>
        </aside>

        {/* Right panel — empty state when no chat selected */}
        <div className="chat-panel-empty">
          <div className="chat-panel-empty-icon" style={{ display: "flex", justifyContent: "center" }}>
            <MessageSquare size={48} color="var(--text-muted)" />
          </div>
          <p className="chat-panel-empty-title">Select a conversation</p>
          <p className="chat-panel-empty-desc">Choose a conversation from the sidebar to view messages</p>
        </div>
      </div>

      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {ratingModal && (
        <RatingModal
          isOpen
          postId={ratingModal.postId}
          postTitle={ratingModal.postTitle}
          ratedUserId={ratingModal.ratedUserId}
          ratedUsername={ratingModal.ratedUsername}
          onClose={() => setRatingModal(null)}
          onSubmitted={() => {
            setRatingModal(null);
            showToast("Rating submitted successfully!");
            refetchPending();
          }}
        />
      )}
    </main>
  );
}
