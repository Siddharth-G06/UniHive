import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useInterests } from "../hooks/useInterests";
import { formatTimeAgo, deletePostWithImages } from "../lib/postHelpers";
import { POST_TYPE_CONFIG, CATEGORY_ICONS, DURATION_OPTIONS } from "../constants/categories";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/posts.css";
import "../styles/exchange.css";

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
        {u?.avatar_url
          ? <img src={u.avatar_url} alt={u.username} className="interest-avatar" />
          : <span className="interest-avatar interest-avatar-initials">{(u?.username ?? "U")[0].toUpperCase()}</span>
        }
        <div>
          <p className="interest-username">@{u?.username ?? "—"}</p>
          {u?.college && <span className={`college-badge badge-${u.college.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "2px 8px" }}>{u.college}</span>}
        </div>
      </div>

      {interest.note && (
        <p className="interest-note">&ldquo;{interest.note}&rdquo;</p>
      )}

      <div className="interest-footer">
        <span style={{ fontSize: "0.75rem", color: statusColor, fontWeight: 600 }}>
          {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
        </span>
        {interest.status === "pending" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-interest-accept"
              onClick={() => onAccept(interest.id, interest.from_user_id)}
              disabled={accepting}
            >
              {accepting ? "..." : "✓ Accept"}
            </button>
            <button
              className="btn-interest-reject"
              onClick={() => onReject(interest.id)}
              disabled={rejecting}
            >
              {rejecting ? "..." : "✗ Reject"}
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

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select(`*, users!user_id ( id, username, avatar_url, reputation_score, college )`)
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
  if (!post) return (
    <div style={{ padding: "80px 24px", textAlign: "center" }}>
      <p style={{ fontSize: "3rem" }}>🔍</p>
      <p style={{ fontWeight: 700 }}>Post not found</p>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/exchange")}>
        ← Back to Exchange
      </button>
    </div>
  );

  const typeCfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.offer;
  const icon = CATEGORY_ICONS[post.category] ?? "📦";
  const poster = post.users;
  const images = post.images || [];

  async function handleSendInterest() {
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
    showToast("Marked as resolved ✅");
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deletePostWithImages(post.id, user.id, images);
    if (!error) navigate("/exchange");
    else setDeleting(false);
  }

  return (
    <main className="post-detail-page" id="exchange-detail-page">
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

          <div className="post-detail-info" style={{ marginTop: 24 }}>
            <div className="post-detail-badges">
              <span
                className="detail-badge"
                style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, position: "static" }}
              >
                {typeCfg.label}
              </span>
              <span className="detail-badge" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-muted)", position: "static" }}>
                {icon} {post.category}
              </span>
              {post.duration_days && (
                <span className="duration-badge">{durationLabel(post.duration_days)}</span>
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
              <p className="post-detail-location"><span>📍</span> {post.location}</p>
            )}
            <p className="post-detail-time">
              Posted {formatTimeAgo(post.created_at)} &nbsp;·&nbsp;{" "}
              {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <aside className="post-sidebar-card">

          {/* Trust signals */}
          <div className="trust-section">
            <p className="poster-label">Posted by</p>
            <div className="poster-info">
              {poster?.avatar_url
                ? <img src={poster.avatar_url} alt={poster.username} className="poster-avatar" />
                : <span className="poster-avatar-initials">{(poster?.username ?? "U")[0].toUpperCase()}</span>
              }
              <div>
                <p className="poster-username">@{poster?.username ?? "—"}</p>
                {poster?.college && (
                  <span className={`college-badge badge-${poster.college.toLowerCase()}`} style={{ fontSize: "0.65rem" }}>
                    {poster.college}
                  </span>
                )}
              </div>
            </div>
            <div className="trust-stats">
              <div className="trust-stat">
                <span className="trust-stat-icon">⭐</span>
                <span className="trust-stat-value">{poster?.reputation_score ?? 0}</span>
                <span className="trust-stat-label">Reputation</span>
              </div>
              <div className="trust-stat">
                <span className="trust-stat-icon">🔄</span>
                <span className="trust-stat-value">{ownerExchangeCount}</span>
                <span className="trust-stat-label">Exchanges</span>
              </div>
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
                        {sendingInterest ? "Sending..." : "Send Interest ✓"}
                      </button>
                    </div>
                  </div>
                )}

                {myInterest && (
                  <div className="interest-status-box">
                    {myInterest.status === "pending" && (
                      <p className="interest-status-msg interest-pending">
                        ⏳ You&apos;ve expressed interest — waiting for response
                      </p>
                    )}
                    {myInterest.status === "accepted" && (
                      <p className="interest-status-msg interest-accepted">
                        🎉 Your interest was accepted! Check your messages.
                      </p>
                    )}
                    {myInterest.status === "rejected" && (
                      <p className="interest-status-msg interest-rejected">
                        This time it didn&apos;t work out. Try another post!
                      </p>
                    )}
                  </div>
                )}

                {interestMsg && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
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
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Loading...</p>
                ) : interests.length === 0 ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No one has expressed interest yet.</p>
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
                  <button className="btn-manage" onClick={() => navigate(`/edit-post/${post.id}`)}>✏️ Edit Post</button>
                  <button className="btn-manage btn-manage-success" onClick={handleResolve} disabled={resolving}>
                    {resolving ? "Updating..." : "✅ Mark as Resolved"}
                  </button>
                  <button className="btn-manage btn-manage-danger" onClick={() => setDeleteModal(true)}>🗑️ Delete Post</button>
                </div>
              </>
            )}

            {post.status === "claimed" && (
              <div className="status-info-box status-info-claimed">🤝 Exchange in progress</div>
            )}
            {post.status === "resolved" && (
              <div className="status-info-box status-info-resolved">✅ Exchange completed!</div>
            )}

            <button className="btn-manage" style={{ fontSize: "0.82rem" }} onClick={() => navigate("/exchange")}>
              ← Back to Exchange
            </button>
          </div>
        </aside>
      </div>

      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">&ldquo;{post.title}&rdquo; will be permanently deleted.</p>
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
