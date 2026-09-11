import { useNavigate } from "react-router-dom";
import { formatTimeAgo, CATEGORY_ICONS } from "../lib/postHelpers";
import "../styles/posts.css";

const TYPE_LABELS = {
  lost:    { label: "LOST",    cls: "badge-lost" },
  found:   { label: "FOUND",   cls: "badge-found" },
  request: { label: "REQUEST", cls: "badge-request" },
  offer:   { label: "OFFER",   cls: "badge-offer" },
};

const STATUS_LABELS = {
  active:   { label: "Active",   cls: "status-active" },
  claimed:  { label: "Claimed",  cls: "status-claimed" },
  resolved: { label: "Resolved", cls: "status-resolved" },
};

const CTA = {
  lost:    "I Found This! 🎉",
  found:   "This is Mine! ✋",
  request: "I Can Help! 🤝",
  offer:   "I Want This! 🙋",
};

/**
 * Post card for feed view.
 * @param {{ post: object, onClaim: function, isOwner: boolean, onDelete: function }} props
 */
export default function PostCard({ post, onClaim, isOwner = false, onDelete }) {
  const navigate = useNavigate();

  const type = TYPE_LABELS[post.type] ?? TYPE_LABELS.lost;
  const status = STATUS_LABELS[post.status] ?? STATUS_LABELS.active;
  const icon = CATEGORY_ICONS[post.category] ?? "📦";
  const firstImage = post.images?.[0];
  const user = post.users;

  return (
    <article
      className="post-card"
      onClick={() => navigate(`/posts/${post.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`${post.type} post: ${post.title}`}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/posts/${post.id}`)}
    >
      {/* Image / Placeholder */}
      <div className="post-card-image">
        {firstImage ? (
          <img src={firstImage} alt={post.title} className="post-card-img" loading="lazy" />
        ) : (
          <div className="post-card-placeholder">
            <span className="placeholder-icon">{icon}</span>
          </div>
        )}
        {/* Badges overlay */}
        <span className={`type-badge ${type.cls}`}>{type.label}</span>
        <span className={`status-badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Body */}
      <div className="post-card-body">
        <span className="post-card-category">{icon} {post.category}</span>
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-desc">{post.description}</p>

        {post.location && (
          <p className="post-card-location">
            <span aria-hidden="true">📍</span> {post.location}
          </p>
        )}

        {/* Footer */}
        <div className="post-card-footer">
          <div className="post-card-user">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="user-avatar-xs" />
            ) : (
              <span className="user-avatar-xs user-avatar-initials-xs">
                {(user?.username ?? "U")[0].toUpperCase()}
              </span>
            )}
            <span className="user-name-sm">{user?.username ?? "Unknown"}</span>
            <span className="post-time">{formatTimeAgo(post.created_at)}</span>
          </div>

          {isOwner ? (
            <div className="post-owner-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="icon-btn"
                title="Edit post"
                onClick={(e) => { e.stopPropagation(); navigate(`/edit-post/${post.id}`); }}
                aria-label="Edit post"
              >✏️</button>
              <button
                className="icon-btn icon-btn-danger"
                title="Delete post"
                onClick={(e) => { e.stopPropagation(); onDelete?.(post); }}
                aria-label="Delete post"
              >🗑️</button>
            </div>
          ) : (
            post.status === "active" && (
              <button
                className="btn btn-cta-sm"
                onClick={(e) => { e.stopPropagation(); onClaim?.(post); }}
              >
                {CTA[post.type]}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
