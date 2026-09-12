import { useNavigate } from "react-router-dom";
import { formatTimeAgo, CATEGORY_ICONS } from "../lib/postHelpers";
import { POST_TYPE_CONFIG, DURATION_OPTIONS } from "../constants/categories";
import "../styles/posts.css";

const STATUS_LABELS = {
  active:   { label: "Active",   cls: "status-active" },
  claimed:  { label: "Claimed",  cls: "status-claimed" },
  resolved: { label: "Resolved", cls: "status-resolved" },
};

function durationLabel(days) {
  if (!days) return null;
  const found = DURATION_OPTIONS.find((d) => d.value === days);
  return found ? `for ${found.label}` : `for ${days} day${days > 1 ? "s" : ""}`;
}

export default function PostCard({ post, onClaim, isOwner = false, onDelete }) {
  const navigate = useNavigate();
  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.lost;
  const status = STATUS_LABELS[post.status] ?? STATUS_LABELS.active;
  const icon = CATEGORY_ICONS[post.category] ?? "📦";
  const firstImage = post.images?.[0];
  const user = post.users;
  const isExchange = post.type === "request" || post.type === "offer";
  const detailPath = isExchange ? `/exchange/${post.id}` : `/posts/${post.id}`;

  return (
    <article
      className="post-card"
      onClick={() => navigate(detailPath)}
      role="button"
      tabIndex={0}
      aria-label={`${post.type} post: ${post.title}`}
      onKeyDown={(e) => e.key === "Enter" && navigate(detailPath)}
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
        {/* Type badge using config colors */}
        <span
          className="type-badge"
          style={{
            background: typeCfg.bg,
            color: typeCfg.color,
            border: `1px solid ${typeCfg.border}`,
          }}
        >
          {typeCfg.label}
        </span>
        {/* Status badge */}
        <span className={`status-badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Body */}
      <div className="post-card-body">
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="post-card-category">{icon} {post.category}</span>
          {post.duration_days && (
            <span className="duration-badge">{durationLabel(post.duration_days)}</span>
          )}
        </div>
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-desc">{post.description}</p>

        {post.location && (
          <p className="post-card-location"><span aria-hidden="true">📍</span> {post.location}</p>
        )}

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
                title="Edit"
                onClick={(e) => { e.stopPropagation(); navigate(`/edit-post/${post.id}`); }}
                aria-label="Edit post"
              >✏️</button>
              <button
                className="icon-btn icon-btn-danger"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); onDelete?.(post); }}
                aria-label="Delete post"
              >🗑️</button>
            </div>
          ) : (
            post.status === "active" && (
              <button
                className="btn-cta-sm"
                style={{ background: typeCfg.ctaColor, borderColor: typeCfg.ctaColor }}
                onClick={(e) => { e.stopPropagation(); onClaim?.(post); }}
              >
                {typeCfg.cta}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
