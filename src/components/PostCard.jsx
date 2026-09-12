import { memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Pencil, Trash2, Clock } from "lucide-react";
import { formatTimeAgo } from "../lib/postHelpers";
import { POST_TYPE_CONFIG, DURATION_OPTIONS } from "../constants/categories";
import CategoryIcon from "./CategoryIcon";
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

const PostCard = memo(function PostCard({ post, onClaim, isOwner = false, onDelete }) {
  const navigate = useNavigate();
  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.lost;
  const status = STATUS_LABELS[post.status] ?? STATUS_LABELS.active;
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
          <img
            src={firstImage}
            alt={post.title}
            className="post-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="post-card-placeholder">
            <div className="placeholder-icon-pill">
              <CategoryIcon category={post.category} size={36} className="placeholder-icon-svg" />
            </div>
            <span className="placeholder-category-text">{post.category || "Item"}</span>
          </div>
        )}

        {/* Type badge */}
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
        <div className="post-card-meta-row">
          <span className="post-card-category">
            <CategoryIcon category={post.category} size={13} style={{ marginRight: 4 }} />
            {post.category}
          </span>
          {post.duration_days && (
            <span className="duration-badge">
              <Clock size={11} style={{ marginRight: 3 }} />
              {durationLabel(post.duration_days)}
            </span>
          )}
        </div>

        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-desc">{post.description}</p>

        {post.location && (
          <p className="post-card-location">
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span>{post.location}</span>
          </p>
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
            <Link
              to={`/users/${user?.username}`}
              className="user-name-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {user?.username ?? "Unknown"}
            </Link>
            <span className="post-time">{formatTimeAgo(post.created_at)}</span>
          </div>

          {isOwner ? (
            <div className="post-owner-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="icon-btn"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/edit-post/${post.id}`);
                }}
                aria-label="Edit post"
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn icon-btn-danger"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(post);
                }}
                aria-label="Delete post"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            post.status === "active" && (
              <button
                className="btn-cta-sm"
                style={{ background: typeCfg.ctaColor, borderColor: typeCfg.ctaColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim?.(post);
                }}
              >
                {typeCfg.cta}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
});

export default PostCard;
