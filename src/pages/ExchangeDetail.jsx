import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  ArrowLeft,
  Check,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  Star,
  RefreshCw,
  Search,
  Handshake,
  Sparkles,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useInterests } from "../hooks/useInterests";
import { formatTimeAgo, deletePostWithImages } from "../lib/postHelpers";
import { POST_TYPE_CONFIG, DURATION_OPTIONS } from "../constants/categories";
import CategoryIcon from "../components/CategoryIcon";
import ReputationBadge from "../components/ReputationBadge";
import RatingModal from "../components/RatingModal";
import StarRating from "../components/StarRating";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/posts.css";
import "../styles/exchange.css";
import "../styles/ratings.css";

function durationLabel(days) {
  if (!days) return null;
  const found = DURATION_OPTIONS.find((d) => d.value === days);
  return found ? found.label : `${days} day${days > 1 ? "s" : ""}`;
}

function InterestItem({ interest, onAccept, onReject, accepting, rejecting }) {
  const u = interest.users;
  const statusColor = {
    pending:  "var(--text-muted)",
    accepted: "var(--success)",
    rejected: "var(--error)",
  }[interest.status] ?? "var(--text-muted)";

  return (
    <div className="interest-item">
      <div className="interest-user">
        {u?.avatar_url ? (
          <img src={u.avatar_url} alt={u.username} className="interest-avatar" />
        ) : (
          <span className="interest-avatar interest-avatar-initials">
            {(u?.username ?? "U")[0].toUpperCase()}
          </span>
        )}
        <div>
          <p className="interest-username">@{u?.username ?? "—"}</p>
          {u?.college && (
            <span className={`college-badge badge-${u.college.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
              {u.college}
            </span>
          )}
        </div>
      </div>

      {interest.note && (
        <p className="interest-note">&ldquo;{interest.note}&rdquo;</p>
      )}

      <div className="interest-footer">
        <span style={{ fontSize: "0.75rem", color: statusColor, fontWeight: 700 }}>
          {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
        </span>
        {interest.status === "pending" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-interest-accept"
              onClick={() => onAccept(interest.id, interest.from_user_id)}
              disabled={accepting}
            >
              <Check size={14} />
              {accepting ? "..." : "Accept"}
            </button>
            <button
              className="btn-interest-reject"
              onClick={() => onReject(interest.id)}
              disabled={rejecting}
            >
              <X size={14} />
              {rejecting ? "..." : "Reject"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExchangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const [ratingModal, setRatingModal] = useState(null);

  // Interest state (for non-owners)
  const [myInterest, setMyInterest] = useState(null);
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [note, setNote] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestMsg, setInterestMsg] = useState("");

  // Owner: completed exchanges count
  const [ownerExchangeCount, setOwnerExchangeCount] = useState(0);

  const isOwner = user?.id === post?.user_id;

  const { interests, loading: interestsLoading, acceptInterest, rejectInterest } = useInterests(
    isOwner ? id : null,
    user?.id
  );
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

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
      if (!error && data) {
        setPost(data);
        // Fetch owner completed exchange count
        const { count } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user_id)
          .eq("status", "resolved");
        setOwnerExchangeCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // Check if current user already has an interest
  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("interests")
      .select("*")
      .eq("post_id", id)
      .eq("from_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMyInterest(data ?? null));
  }, [id, user]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!post) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Search size={48} color="var(--text-muted)" />
        </div>
        <p style={{ fontWeight: 800, fontSize: "1.2rem" }}>Exchange post not found</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/exchange")}>
          <ArrowLeft size={16} /> Back to Exchange
        </button>
      </div>
    );
  }

  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.offer;
  const poster = post.users;
  const images = post.images || [];

  async function handleSendInterest() {
    if (!user) {
      navigate("/login");
      return;
    }
    setSendingInterest(true);
    const { data, error } = await supabase
      .from("interests")
      .insert({ post_id: id, from_user_id: user.id, note: note.trim() || null, status: "pending" })
      .select()
      .single();
    setSendingInterest(false);
    if (error) {
      setInterestMsg("Failed to send: " + error.message);
    } else {
      setMyInterest(data);
      setShowNoteBox(false);
      setInterestMsg("Your interest has been sent! The owner will review and get back to you.");
    }
  }

  async function handleAccept(interestId, fromUserId) {
    setAcceptingId(interestId);
    const { error } = await acceptInterest(interestId, fromUserId);
    setAcceptingId(null);
    if (!error) {
      setPost((prev) => ({ ...prev, status: "claimed" }));
      showToast("Interest accepted! A conversation has been created.");
    }
  }

  async function handleReject(interestId) {
    setRejectingId(interestId);
    await rejectInterest(interestId);
    setRejectingId(null);
  }

  async function handleResolve() {
    setResolving(true);
    await supabase.from("posts").update({ status: "resolved" }).eq("id", post.id);
    setPost((prev) => ({ ...prev, status: "resolved" }));
    setResolving(false);

    // Open rating modal after resolving
    const { data: conv } = await supabase
      .from("conversations")
      .select(`*, user_a:users!user_a_id(id, username), user_b:users!user_b_id(id, username)`)
      .eq("post_id", post.id)
      .maybeSingle();

    if (conv) {
      const otherUser = conv.user_a_id === user.id ? conv.user_b : conv.user_a;
      setRatingModal({ ratedUserId: otherUser.id, ratedUsername: otherUser.username });
    } else {
      showToast("Marked as resolved");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deletePostWithImages(post.id, user.id, images);
    if (!error) {
      navigate("/exchange");
    } else {
      setDeleting(false);
    }
  }

  return (
    <main className="post-detail-page" id="exchange-detail-page">
      <div className="post-detail-inner">

        {/* ── Left: Gallery + Info ── */}
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
              {post.duration_days && (
                <span className="duration-badge" style={{ position: "static" }}>
                  <Clock size={12} style={{ marginRight: 3 }} />
                  {durationLabel(post.duration_days)}
                </span>
              )}
            </div>

            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-desc">{post.description}</p>

            {post.reason && (
              <div className="reason-box">
                <p className="reason-label">
                  {post.type === "request" ? "Why they need it:" : "Lending conditions:"}
                </p>
                <p className="reason-text">{post.reason}</p>
              </div>
            )}

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

          {/* Trust signals */}
          <div className="trust-section">
            <p className="poster-label">Posted by</p>
            <Link to={`/users/${poster?.username}`} style={{ textDecoration: "none" }}>
              <div className="poster-info" style={{ marginTop: 10 }}>
                {poster?.avatar_url ? (
                  <img src={poster.avatar_url} alt={poster.username} className="poster-avatar" />
                ) : (
                  <span className="poster-avatar-initials">{(poster?.username ?? "U")[0].toUpperCase()}</span>
                )}
                <div>
                  <p className="poster-username">@{poster?.username ?? "—"}</p>
                  {poster?.college && (
                    <span className={`college-badge badge-${poster.college.toLowerCase()}`} style={{ fontSize: "0.65rem" }}>
                      {poster.college}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <div className="trust-stats" style={{ marginTop: 14 }}>
              <div className="trust-stat">
                <span className="trust-stat-icon" style={{ color: "#f59e0b" }}>
                  <Star size={18} fill="#f59e0b" />
                </span>
                <span className="trust-stat-value">
                  {poster?.reputation_score ? Number(poster.reputation_score).toFixed(1) : "—"}
                </span>
                <span className="trust-stat-label">Rating</span>
              </div>
              <div className="trust-stat">
                <span className="trust-stat-icon" style={{ color: "var(--primary)" }}>
                  <RefreshCw size={18} />
                </span>
                <span className="trust-stat-value">{ownerExchangeCount}</span>
                <span className="trust-stat-label">Exchanges</span>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <StarRating value={Math.round(poster?.reputation_score ?? 0)} readonly size="sm" />
              <ReputationBadge score={poster?.reputation_score} ratingCount={poster?.rating_count} size="sm" />
            </div>
          </div>

          {/* Action section */}
          <div className="action-section">
            {/* Non-owner, active post */}
            {post.status === "active" && !isOwner && (
              <>
                {!myInterest && !showNoteBox && (
                  <>
                    <p className="action-section-title">{typeCfg.cta.split(" ").slice(1).join(" ")}</p>
                    <button
                      id="express-interest-btn"
                      className="btn-cta-full"
                      style={{ background: typeCfg.ctaColor, borderColor: typeCfg.ctaColor }}
                      onClick={() => setShowNoteBox(true)}
                    >
                      <Handshake size={18} />
                      {typeCfg.cta}
                    </button>
                  </>
                )}

                {showNoteBox && !myInterest && (
                  <div className="note-box">
                    <label className="form-label" style={{ fontSize: "0.82rem" }}>
                      Add a note <span className="optional-label">(optional)</span>
                    </label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: 70, resize: "vertical", fontFamily: "var(--font)", fontSize: "0.875rem" }}
                      placeholder="e.g. I have it available from Thursday..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.85rem" }} onClick={() => setShowNoteBox(false)}>
                        Cancel
                      </button>
                      <button
                        id="send-interest-btn"
                        className="btn-cta-full"
                        style={{ flex: 2, background: typeCfg.ctaColor, borderColor: typeCfg.ctaColor, padding: "10px" }}
                        onClick={handleSendInterest}
                        disabled={sendingInterest}
                      >
                        <Check size={16} />
                        {sendingInterest ? "Sending..." : "Send Interest"}
                      </button>
                    </div>
                  </div>
                )}

                {myInterest && (
                  <div className="interest-status-box">
                    {myInterest.status === "pending" && (
                      <p className="interest-status-msg interest-pending" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={16} /> You have expressed interest &mdash; waiting for response
                      </p>
                    )}
                    {myInterest.status === "accepted" && (
                      <p className="interest-status-msg interest-accepted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Sparkles size={16} /> Your interest was accepted! Check your messages.
                      </p>
                    )}
                    {myInterest.status === "rejected" && (
                      <p className="interest-status-msg interest-rejected" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <X size={16} /> This exchange was not matched. Try another post!
                      </p>
                    )}
                  </div>
                )}

                {interestMsg && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
                    {interestMsg}
                  </p>
                )}
              </>
            )}

            {/* Owner: manage interests */}
            {post.status === "active" && isOwner && (
              <>
                <p className="action-section-title">
                  Interested Students
                  {interests.length > 0 && (
                    <span style={{ marginLeft: 8, background: "var(--primary)", color: "white", borderRadius: "100px", padding: "1px 8px", fontSize: "0.72rem" }}>
                      {interests.filter((i) => i.status === "pending").length}
                    </span>
                  )}
                </p>
                {interestsLoading ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading...</p>
                ) : interests.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No one has expressed interest yet.</p>
                ) : (
                  <div className="interest-list">
                    {interests.map((interest) => (
                      <InterestItem
                        key={interest.id}
                        interest={interest}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        accepting={acceptingId === interest.id}
                        rejecting={rejectingId === interest.id}
                      />
                    ))}
                  </div>
                )}

                {/* Owner manage actions */}
                <div className="manage-actions" style={{ marginTop: 16 }}>
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
              </>
            )}

            {post.status === "claimed" && (
              <div className="status-info-box status-info-claimed">
                <Handshake size={18} /> Exchange in progress
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
                <CheckCircle2 size={18} /> Exchange completed!
              </div>
            )}

            <button className="btn-manage" style={{ fontSize: "0.85rem", marginTop: 12 }} onClick={() => navigate("/exchange")}>
              <ArrowLeft size={15} /> Back to Exchange
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
            showToast("Exchange resolved!");
          }}
          onSubmitted={() => {
            setRatingModal(null);
            showToast("Rating submitted!");
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
