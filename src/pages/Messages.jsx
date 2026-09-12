import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../hooks/useConversations";
import ConversationItem from "../components/ConversationItem";
import "../styles/chat.css";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId: activeId } = useParams();
  const { conversations, loading, totalUnread } = useConversations(user?.id);

  return (
    <main className="messages-page" id="messages-page">
      <div className="messages-layout">
        {/* Sidebar — conversation list */}
        <aside className="conv-sidebar">
          <div className="conv-sidebar-header">
            <h1 className="conv-sidebar-title">
              Messages
              {totalUnread > 0 && (
                <span className="conv-total-unread">{totalUnread}</span>
              )}
            </h1>
          </div>

          <div className="conv-list" role="list">
            {loading && (
              <div className="conv-skeletons">
                {[1,2,3].map((i) => <div key={i} className="conv-skeleton" />)}
              </div>
            )}

            {!loading && conversations.length === 0 && (
              <div className="conv-empty">
                <span className="conv-empty-icon">💬</span>
                <p className="conv-empty-title">No conversations yet</p>
                <p className="conv-empty-desc">
                  Express interest in a post to start chatting!
                </p>
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
          <span className="chat-panel-empty-icon">💬</span>
          <p className="chat-panel-empty-title">Select a conversation</p>
          <p className="chat-panel-empty-desc">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    </main>
  );
}
