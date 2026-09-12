import { memo } from "react";
import { Check, CheckCheck } from "lucide-react";
import "../styles/chat.css";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/**
 * Single message bubble.
 * @param {{ message, isOwn, isGrouped, currentUserId }} props
 */
const MessageBubble = memo(function MessageBubble({ message, isOwn, isGrouped }) {
  const isOptimistic = message._optimistic;
  const isFailed = message._failed;

  return (
    <div className={`bubble-row ${isOwn ? "bubble-row-own" : "bubble-row-other"} ${isGrouped ? "bubble-grouped" : ""}`}>
      {/* Other user avatar */}
      {!isOwn && (
        <div className="bubble-avatar-slot">
          {!isGrouped && (
            message.sender?.avatar_url
              ? <img src={message.sender.avatar_url} alt={message.sender.username} className="bubble-avatar" />
              : <span className="bubble-avatar bubble-avatar-initials">
                  {(message.sender?.username ?? "U")[0].toUpperCase()}
                </span>
          )}
        </div>
      )}

      <div className="bubble-content">
        <div
          className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} ${isOptimistic ? "bubble-optimistic" : ""} ${isFailed ? "bubble-failed" : ""}`}
        >
          <p className="bubble-text">{message.content}</p>
          {isFailed && (
            <p className="bubble-failed-hint">Failed to send. Check connection.</p>
          )}
        </div>
        {!isGrouped && (
          <span className={`bubble-time ${isOwn ? "bubble-time-own" : "bubble-time-other"}`}>
            {formatTime(message.created_at)}
            {isOwn && message.read_at && (
              <span className="bubble-read" title="Read" style={{ display: "inline-flex", alignItems: "center" }}>
                <CheckCheck size={13} strokeWidth={2.5} />
              </span>
            )}
            {isOwn && !message.read_at && !isOptimistic && (
              <span className="bubble-sent" title="Sent" style={{ display: "inline-flex", alignItems: "center" }}>
                <Check size={12} strokeWidth={2.5} />
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
