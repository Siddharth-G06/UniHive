import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Search,
  Handshake,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  formatTimeAgo,
  createInterestAndConversation,
  deletePostWithImages,
} from "../lib/postHelpers";
import { POST_TYPE_CONFIG } from "../constants/categories";
import CategoryIcon from "../components/CategoryIcon";
import ReputationBadge from "../components/ReputationBadge";
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

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

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
  if (!post) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Search size={48} color="var(--text-muted)" />
        </div>
        <h1 style={{ marginTop: 12 }}>Post not found</h1>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/lost-found")}>
          <ArrowLeft size={16} /> Back to Feed
        </button>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;
  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.lost;
  const poster = post.users;
  const images = post.images || [];

  async function handleClaim() {
    if (!user) {
      navigate("/login");
      return;
    }
    setClaiming(true);
    setClaimMsg("");
    const result = await createInterestAndConversation(post.id, post.user_id, user.id);
    if (result?.error === "already_exists") {
      setClaimMsg("You have already expressed interest in this post.");
    } else if (!result?.error) {
      setClaimMsg("Interest sent! The owner will be able to message you.");
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

    // Open rating modal for the other party if conversation exists
    const { data: conv } = await supabase
      .from("conversations")
      .select(`*, user_a:users!user_a_id(id, username), user_b:users!user_b_id(id, username)`)
      .eq("post_id", post.id)
      .maybeSingle();

    if (conv) {
      const otherUser = conv.user_a_id === user.id ? conv.user_b : conv.user_a;
      setRatingModal({ ratedUserId: otherUser.id, ratedUsername: otherUser.username });
    } else {
      showToast("Post marked as resolved!");
    }
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

        {/* ── Left: Gallery + Details ── */}
        <div>
          <div className="gallery-main">
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={post.title} />
            ) : (
              <div className="gallery-main-placeholder">
                <CategoryIcon category={post.category} size={64} />
                <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{post.category || "Item"}</span>
              </div>
            )}
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
                  onKeyDown={(e) => e.key === "Enter" && setActiveImg(i)}
                >
                  <img src={url} alt={`Thumb ${i + 1}`} />
                </div>
              ))}
            </div>
          )}

          <div className="post-detail-info" style={{ marginTop: 24 }}>
            <div className="post-detail-badges">
              <span
                className="detail-badge"
                style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, position: "static" }}
              >
                {typeCfg.label}
              </span>
              <span
                className="detail-badge"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-muted)", position: "static" }}
              >
                <CategoryIcon category={post.category} size={14} style={{ marginRight: 4 }} />
                {post.category}
              </span>
              <span
                className={`detail-badge status-badge ${
                  post.status === "active" ? "status-active" : post.status === "claimed" ? "status-claimed" : "status-resolved"
                }`}
                style={{ position: "static" }}
              >
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>

            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-desc">{post.description}</p>

            {post.location && (
              <p className="post-detail-location">
                <MapPin size={16} color="var(--primary)" />
                <span>{post.location}</span>
              </p>
            )}

            <p className="post-detail-time" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} />
              <span>Posted {formatTimeAgo(post.created_at)}</span>
              <span>&middot;</span>
              <span>{new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <aside className="post-sidebar-card">
          {/* Poster info */}
          <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <p className="poster-label">Posted by</p>
            <div className="poster-info" style={{ marginTop: 10 }}>
              <Link to={`/users/${poster?.username}`} style={{ textDecoration: "none" }}>
                {poster?.avatar_url ? (
                  <img src={poster.avatar_url} alt={poster.username} className="poster-avatar" />
                ) : (
                  <span className="poster-avatar-initials">{(poster?.username ?? "U")[0].toUpperCase()}</span>
                )}
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
                  <ReputationBadge score={poster?.reputation_score} ratingCount={poster?.rating_count} size="sm" />
                </div>
                <div style={{ marginTop: 4 }}>
                  <StarRating value={Math.round(poster?.reputation_score ?? 0)} readonly size="sm" />
                </div>
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
                  <Handshake size={18} />
                  {claiming ? "Sending..." : typeCfg.cta}
                </button>
                {claimMsg && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
                    {claimMsg}
                  </p>
                )}
              </>
            )}

            {post.status === "active" && isOwner && (
              <div className="manage-actions">
                <button className="btn-manage" onClick={() => navigate(`/edit-post/${post.id}`)}>
                  <Pencil size={15} /> Edit Post
                </button>
                <button className="btn-manage btn-manage-success" onClick={handleResolve} disabled={resolving}>
                  <CheckCircle2 size={15} />
                  {resolving ? "Updating..." : "Mark as Resolved"}
                </button>
                <button className="btn-manage btn-manage-danger" onClick={() => setDeleteModal(true)}>
                  <Trash2 size={15} /> Delete Post
                </button>
              </div>
            )}

            {post.status === "claimed" && (
              <div className="status-info-box status-info-claimed">
                <Handshake size={18} /> Someone has expressed interest
                {isOwner && (
                  <button
                    className="btn-manage btn-manage-success"
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    <CheckCircle2 size={15} /> Mark as Resolved
                  </button>
                )}
              </div>
            )}

            {post.status === "resolved" && (
              <div className="status-info-box status-info-resolved">
                <CheckCircle2 size={18} /> This post has been resolved
              </div>
            )}

            <button
              className="btn-manage"
              style={{ fontSize: "0.85rem", marginTop: 12 }}
              onClick={() => navigate("/lost-found")}
            >
              <ArrowLeft size={15} /> Back to Lost &amp; Found
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
          onClose={() => {
            setRatingModal(null);
            showToast("Post resolved!");
          }}
          onSubmitted={() => {
            setRatingModal(null);
            showToast("Post resolved and rating submitted!");
          }}
        />
      )}

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">&ldquo;{post.title}&rdquo; will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--error)", borderColor: "var(--error)" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
