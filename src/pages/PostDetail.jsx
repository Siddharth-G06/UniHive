import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  formatTimeAgo, CATEGORY_ICONS,
  createInterestAndConversation, deletePostWithImages
} from "../lib/postHelpers";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/posts.css";

const CTA = {
  lost:    "I Found This! 🎉",
  found:   "This is Mine! ✋",
  request: "I Can Help! 🤝",
  offer:   "I Want This! 🙋",
};

const TYPE_CLS = {
  lost: "badge-lost", found: "badge-found",
  request: "badge-request", offer: "badge-offer",
};
const STATUS_CLS = {
  active: "status-active", claimed: "status-claimed", resolved: "status-resolved",
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const [resolving, setResolving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select(`*, users!user_id ( id, username, avatar_url, reputation_score, college )`)
        .eq("id", id)
        .single();
      if (!error && data) setPost(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!post) return (
    <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
      <p style={{ fontSize: "3rem", marginBottom: 8 }}>🔍</p>
      <p style={{ fontWeight: 700, fontSize: "1.2rem" }}>Post not found</p>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/lost-found")}>
        Back to Lost &amp; Found
      </button>
    </div>
  );

  const isOwner = user?.id === post.user_id;
  const poster = post.users;
  const icon = CATEGORY_ICONS[post.category] ?? "📦";
  const images = post.images || [];

  async function handleClaim() {
    if (!user) return;
    setClaiming(true);
    setClaimMsg("");
    const { error } = await createInterestAndConversation(post.id, post.user_id, user.id);
    if (error === "already_exists") {
      setClaimMsg("You''ve already expressed interest in this post.");
    } else if (error) {
      setClaimMsg("Something went wrong. Try again.");
    } else {
      setClaimMsg("Interest sent! Check your messages 📬");
      setPost((prev) => ({ ...prev, status: "claimed" }));
    }
    setClaiming(false);
  }

  async function handleResolve() {
    setResolving(true);
    await supabase.from("posts").update({ status: "resolved" }).eq("id", post.id);
    setPost((prev) => ({ ...prev, status: "resolved" }));
    setResolving(false);
    showToast("Post marked as resolved ✅");
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deletePostWithImages(post.id, user.id, images);
    if (!error) {
      navigate("/lost-found");
    } else {
      setDeleting(false);
    }
  }

  return (
    <main className="post-detail-page" id="post-detail-page">
      <div className="post-detail-inner">
        {/* Left: Gallery + Info */}
        <div>
          {/* Gallery */}
          <div className="gallery-main">
            {images.length > 0
              ? <img src={images[activeImg]} alt={post.title} />
              : <span className="gallery-main-placeholder">{icon}</span>
            }
          </div>
          {images.length > 1 && (
            <div className="gallery-strip">
              {images.map((url, i) => (
                <div
                  key={i}
                  className={`gallery-thumb ${i === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Image ${i + 1}`}
                  onKeyDown={(e) => e.key === "Enter" && setActiveImg(i)}
                >
                  <img src={url} alt={`Thumbnail ${i + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="post-detail-info" style={{ marginTop: 24 }}>
            <div className="post-detail-badges">
              <span className={`type-badge detail-badge ${TYPE_CLS[post.type] ?? "badge-lost"}`} style={{ position: "static" }}>
                {post.type.toUpperCase()}
              </span>
              <span className={`status-badge detail-badge ${STATUS_CLS[post.status] ?? "status-active"}`} style={{ position: "static" }}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
              <span className="detail-badge" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-muted)", position: "static" }}>
                {icon} {post.category}
              </span>
            </div>

            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-desc">{post.description}</p>

            {post.location && (
              <p className="post-detail-location">
                <span aria-hidden="true">📍</span> {post.location}
              </p>
            )}

            <p className="post-detail-time">
              Posted {formatTimeAgo(post.created_at)} &nbsp;·&nbsp;{" "}
              {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="post-sidebar-card">
          {/* Poster info */}
          <div className="poster-section">
            <p className="poster-label">Posted by</p>
            <div className="poster-info">
              {poster?.avatar_url
                ? <img src={poster.avatar_url} alt={poster.username} className="poster-avatar" />
                : <span className="poster-avatar-initials">{(poster?.username ?? "U")[0].toUpperCase()}</span>
              }
              <div>
                <p className="poster-username">@{poster?.username ?? "—"}</p>
                <p className="poster-rep">⭐ {poster?.reputation_score ?? 0} reputation</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="action-section">
            {post.status === "active" && !isOwner && (
              <>
                <p className="action-section-title">Is this yours?</p>
                <button
                  id="claim-btn"
                  className="btn-cta-full"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? "Sending..." : CTA[post.type]}
                </button>
                {claimMsg && (
                  <p style={{ fontSize: "0.82rem", textAlign: "center", color: "var(--text-muted)" }}>
                    {claimMsg}
                  </p>
                )}
              </>
            )}

            {post.status === "active" && isOwner && (
              <>
                <p className="action-section-title">Manage Post</p>
                <div className="manage-actions">
                  <button
                    className="btn-manage"
                    onClick={() => navigate(`/edit-post/${post.id}`)}
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    className="btn-manage btn-manage-success"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    {resolving ? "Updating..." : "✅ Mark as Resolved"}
                  </button>
                  <button
                    className="btn-manage btn-manage-danger"
                    onClick={() => setDeleteModal(true)}
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </>
            )}

            {post.status === "claimed" && (
              <div className="status-info-box status-info-claimed">
                🤝 Someone is working on returning this item
              </div>
            )}

            {post.status === "resolved" && (
              <div className="status-info-box status-info-resolved">
                ✅ This item has been returned!
              </div>
            )}
          </div>

          {/* Back link */}
          <button
            className="btn-manage"
            onClick={() => navigate("/lost-found")}
            style={{ fontSize: "0.82rem" }}
          >
            ← Back to Lost &amp; Found
          </button>
        </aside>
      </div>

      {/* Toast */}
      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">
              &ldquo;{post.title}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--error)", borderColor: "var(--error)" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
