import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  formatTimeAgo, CATEGORY_ICONS,
  createInterestAndConversation, deletePostWithImages
} from "../lib/postHelpers";
import { POST_TYPE_CONFIG, CATEGORY_ICONS as CAT_ICONS } from "../constants/categories";
import { getReputationBadge, formatReputationScore } from "../utils/reputationHelpers";
import RatingModal from "../components/RatingModal";
import StarRating from "../components/StarRating";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/posts.css";
import "../styles/ratings.css";

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
  const [ratingModal, setRatingModal] = useState(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select(`*, users!user_id ( id, username, avatar_url, reputation_score, rating_count, college )`)
        .eq("id", id)
        .single();
      if (!error && data) setPost(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!post) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <p style={{ fontSize: "3rem" }}>🔍</p>
      <h1 style={{ marginTop: 12 }}>Post not found</h1>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/lost-found")}>
        ← Back to Feed
      </button>
    </div>
  );

  const isOwner = user?.id === post.user_id;
  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.lost;
  const icon = CAT_ICONS[post.category] ?? "📦";
  const poster = post.users;
  const images = post.images || [];
  const badge = getReputationBadge(poster?.reputation_score, poster?.rating_count);
  const scoreDisplay = formatReputationScore(poster?.reputation_score, poster?.rating_count);

  async function handleClaim() {
    if (!user) return;
    setClaiming(true); setClaimMsg("");
    const result = await createInterestAndConversation(post.id, post.user_id, user.id);
    if (result?.error === "already_exists") {
      setClaimMsg("You''ve already expressed interest.");
    } else if (!result?.error) {
      setClaimMsg("Interest sent! The poster will contact you.");
    } else {
      setClaimMsg(result.error);
    }
    setClaiming(false);
  }

  async function handleResolve() {
    setResolving(true);
    await supabase.from("posts").update({ status: "resolved" }).eq("id", post.id);
    setPost((p) => ({ ...p, status: "resolved" }));
    setResolving(false);

    // Open rating modal for the other party
    const { data: conv } = await supabase
      .from("conversations")
      .select(`*, user_a:users!user_a_id(id, username), user_b:users!user_b_id(id, username)`)
      .eq("post_id", post.id)
      .maybeSingle();

    if (conv) {
      const otherUser = conv.user_a_id === user.id ? conv.user_b : conv.user_a;
      setRatingModal({ ratedUserId: otherUser.id, ratedUsername: otherUser.username });
    } else {
      showToast("Post marked as resolved! ✅");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deletePostWithImages(post.id, user.id, images);
    if (!error) navigate("/lost-found");
    else setDeleting(false);
  }

  return (
    <main className="post-detail-page" id="post-detail-page">
      <div className="post-detail-inner">

        {/* ── Left: Gallery + Info ── */}
        <div>
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
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setActiveImg(i)}
                >
                  <img src={url} alt={`Thumb ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
          <div className="post-detail-info" style={{ marginTop: 20 }}>
            <div className="post-detail-badges">
              <span className="detail-badge" style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, position: "static" }}>
                {typeCfg.label}
              </span>
              <span className="detail-badge" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-muted)", position: "static" }}>
                {icon} {post.category}
              </span>
              <span className={`detail-badge status-badge ${post.status === "active" ? "status-active" : post.status === "claimed" ? "status-claimed" : "status-resolved"}`} style={{ position: "static" }}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>
            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-desc">{post.description}</p>
            {post.location && <p className="post-detail-location"><span>📍</span> {post.location}</p>}
            <p className="post-detail-time">
              Posted {formatTimeAgo(post.created_at)} &nbsp;·&nbsp;
              {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <aside className="post-sidebar-card">
          {/* Poster info */}
          <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
            <p className="poster-label">Posted by</p>
            <div className="poster-info">
              <Link to={`/users/${poster?.username}`} style={{ textDecoration: "none" }}>
                {poster?.avatar_url
                  ? <img src={poster.avatar_url} alt={poster.username} className="poster-avatar" />
                  : <span className="poster-avatar-initials">{(poster?.username ?? "U")[0].toUpperCase()}</span>
                }
              </Link>
              <div>
                <Link to={`/users/${poster?.username}`} style={{ textDecoration: "none" }}>
                  <p className="poster-username">@{poster?.username ?? "—"}</p>
                </Link>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                  {poster?.college && (
                    <span className={`college-badge badge-${poster.college.toLowerCase()}`} style={{ fontSize: "0.65rem" }}>
                      {poster.college}
                    </span>
                  )}
                  <span className="rep-badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.icon} {scoreDisplay !== "New" ? `★ ${scoreDisplay}` : "New"}
                  </span>
                </div>
                <StarRating value={Math.round(poster?.reputation_score ?? 0)} readonly size="sm" />
              </div>
            </div>
          </div>

          {/* CTA / Owner actions */}
          <div className="action-section">
            {post.status === "active" && !isOwner && (
              <>
                <button
                  id="claim-post-btn"
                  className="btn-cta-full"
                  style={{ background: typeCfg.ctaColor, borderColor: typeCfg.ctaColor }}
                  onClick={handleClaim}
                  disabled={claiming || !!claimMsg}
                >
                  {claiming ? "Sending..." : typeCfg.cta}
                </button>
                {claimMsg && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
                    {claimMsg}
                  </p>
                )}
              </>
            )}

            {post.status === "active" && isOwner && (
              <div className="manage-actions">
                <button className="btn-manage" onClick={() => navigate(`/edit-post/${post.id}`)}>✏️ Edit Post</button>
                <button className="btn-manage btn-manage-success" onClick={handleResolve} disabled={resolving}>
                  {resolving ? "Updating..." : "✅ Mark as Resolved"}
                </button>
                <button className="btn-manage btn-manage-danger" onClick={() => setDeleteModal(true)}>🗑️ Delete Post</button>
              </div>
            )}

            {post.status === "claimed" && (
              <div className="status-info-box status-info-claimed">
                🤝 Someone has expressed interest
                {isOwner && (
                  <button className="btn-manage btn-manage-success" style={{ marginTop: 8 }} onClick={handleResolve} disabled={resolving}>
                    ✅ Mark as Resolved
                  </button>
                )}
              </div>
            )}

            {post.status === "resolved" && (
              <div className="status-info-box status-info-resolved">✅ This post has been resolved</div>
            )}

            <button className="btn-manage" style={{ fontSize: "0.82rem", marginTop: 12 }} onClick={() => navigate("/lost-found")}>
              ← Back to Lost & Found
            </button>
          </div>
        </aside>
      </div>

      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {ratingModal && (
        <RatingModal
          isOpen
          postId={post.id}
          postTitle={post.title}
          ratedUserId={ratingModal.ratedUserId}
          ratedUsername={ratingModal.ratedUsername}
          onClose={() => { setRatingModal(null); showToast("Post resolved! ✅"); }}
          onSubmitted={() => { setRatingModal(null); showToast("Post resolved and rating submitted! ✅⭐"); }}
        />
      )}

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">&ldquo;{post.title}&rdquo; will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="btn btn-primary" style={{ background: "var(--error)", borderColor: "var(--error)" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
