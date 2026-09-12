import { formatTimeAgo } from "../lib/postHelpers";
import { POST_TYPE_CONFIG } from "../constants/categories";
import CategoryIcon from "./CategoryIcon";
import "../styles/chat.css";

/**
 * Single row in the conversations list.
 */
export default function ConversationItem({ conversation, isActive, onClick, currentUserId }) {
  const { otherUser, lastMsg, unreadCount, post } = conversation;
  const hasUnread = (unreadCount ?? 0) > 0;
  const isOwnLast = lastMsg?.sender_id === currentUserId;
  const typeCfg = POST_TYPE_CONFIG[post?.type];

  let preview = "No messages yet";
  if (lastMsg) {
    const text = lastMsg.content.length > 50
      ? lastMsg.content.slice(0, 47) + "..."
      : lastMsg.content;
    preview = isOwnLast ? `You: ${text}` : text;
  }

  return (
    <button
      className={`conv-item ${isActive ? "conv-item-active" : ""} ${hasUnread ? "conv-item-unread" : ""}`}
      onClick={onClick}
      aria-label={`Conversation with ${otherUser?.username}`}
    >
      {/* Avatar + unread dot */}
      <div className="conv-avatar-wrap">
        {otherUser?.avatar_url ? (
          <img src={otherUser.avatar_url} alt={otherUser.username} className="conv-avatar" />
        ) : (
          <span className="conv-avatar conv-avatar-initials">{(otherUser?.username ?? "U")[0].toUpperCase()}</span>
        )}
        {hasUnread && <span className="conv-unread-dot" aria-hidden="true" />}
      </div>

      {/* Main content */}
      <div className="conv-body">
        <div className="conv-top-row">
          <span className={`conv-username ${hasUnread ? "conv-username-bold" : ""}`}>
            {otherUser?.username ?? "Unknown"}
          </span>
          {lastMsg && (
            <span className="conv-time">{formatTimeAgo(lastMsg.created_at)}</span>
          )}
        </div>

        <div className="conv-post-context" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {typeCfg && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: typeCfg.color,
                background: typeCfg.bg,
                padding: "1px 5px",
                borderRadius: "4px",
                border: `1px solid ${typeCfg.border}`,
              }}
            >
              {typeCfg.label}
            </span>
          )}
          {post?.category && <CategoryIcon category={post.category} size={12} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post?.title ?? "Item"}
          </span>
        </div>

        <div className="conv-bottom-row">
          <p className={`conv-preview ${isOwnLast ? "conv-preview-own" : ""} ${hasUnread ? "conv-preview-bold" : ""}`}>
            {preview}
          </p>
          {hasUnread && (
            <span className="conv-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}
