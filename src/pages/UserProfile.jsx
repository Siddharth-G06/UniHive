import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useRatings } from "../hooks/useRatings";
import { usePosts } from "../hooks/usePosts";
import { usePendingRatings } from "../hooks/usePendingRatings";
import {
  getReputationBadge, formatReputationScore,
} from "../utils/reputationHelpers";
import StarRating from "../components/StarRating";
import RatingModal from "../components/RatingModal";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/ratings.css";
import "../styles/posts.css";
import "../styles/profile.css";

function formatMemberSince(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function UserProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [ratingModal, setRatingModal] = useState(null); // { postId, postTitle }
  const [toast, setToast] = useState("");

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  // Load user by username
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();
      if (data) {
        setProfileUser(data);
        // Count resolved posts
        const { count } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.id)
          .eq("status", "resolved");
        setResolvedCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  const { ratings, breakdown, averageScore } = useRatings(profileUser?.id);
  const { posts } = usePosts({ userId: profileUser?.id, status: "active" });
  const { pendingRatings, refetch: refetchPending } = usePendingRatings(
    isOwnProfile ? currentUser?.id : null
  );

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!profileUser) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <p style={{ fontSize: "3rem" }}>🔍</p>
      <h1 style={{ marginTop: 12 }}>User not found</h1>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
        Go Back
      </button>
    </div>
  );

  const badge = getReputationBadge(profileUser.reputation_score, profileUser.rating_count ?? ratings.length);
  const scoreDisplay = formatReputationScore(profileUser.reputation_score, profileUser.rating_count ?? ratings.length);
  const totalRatings = profileUser.rating_count ?? ratings.length;

  return (
    <main className="user-profile-page" id="user-profile-page">

      {/* ── Profile Header ── */}
      <div className="profile-header-card">
        {profileUser.avatar_url
          ? <img src={profileUser.avatar_url} alt={profileUser.username} className="profile-big-avatar" />
          : <span className="profile-big-avatar-initials">{(profileUser.username ?? "U")[0].toUpperCase()}</span>
        }
        <div className="profile-meta">
          <h1 className="profile-display-name">
            {profileUser.full_name || `@${profileUser.username}`}
          </h1>
          <div className="profile-username-line">
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>@{profileUser.username}</span>
            {profileUser.college && (
              <span className={`college-badge badge-${profileUser.college.toLowerCase()}`}>
                {profileUser.college}
              </span>
            )}
            <span
              className="rep-badge"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.icon} {badge.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span className="profile-member-since">
              🗓️ Member since {formatMemberSince(profileUser.created_at)}
            </span>
            <span className="profile-member-since">🔄 {resolvedCount} completed exchanges</span>
          </div>
          {isOwnProfile && (
            <Link to="/profile" className="btn btn-outline" style={{ marginTop: 12, fontSize: "0.82rem", padding: "6px 14px" }}>
              ✏️ Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* ── Pending Ratings Banner (own profile) ── */}
      {isOwnProfile && pendingRatings.length > 0 && (
        <div className="pending-rating-banner">
          <p className="pending-banner-title">
            ⭐ You have {pendingRatings.length} pending rating{pendingRatings.length > 1 ? "s" : ""}.
            Your feedback helps build trust in the community.
          </p>
          {pendingRatings.map((pr) => (
            <div key={pr.conversationId} className="pending-item">
              <div className="pending-item-info">
                <p className="pending-item-user">@{pr.otherUser?.username}</p>
                <p className="pending-item-post">Re: {pr.post?.title}</p>
              </div>
              <button
                className="btn-rate-now"
                onClick={() => setRatingModal({
                  postId: pr.post.id,
                  postTitle: pr.post.title,
                  ratedUserId: pr.otherUser.id,
                  ratedUsername: pr.otherUser.username,
                })}
              >
                Rate Now ★
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Reputation ── */}
      <div className="reputation-section">
        <p className="rep-section-title">Reputation</p>
        <div className="rep-score-display">
          <span className="rep-score-big">
            {scoreDisplay === "New" ? "🌱" : `★ ${scoreDisplay}`}
          </span>
          <div className="rep-score-meta">
            <StarRating value={Math.round(averageScore)} readonly size="sm" />
            <span className="rep-score-count">
              {totalRatings > 0 ? `${totalRatings} rating${totalRatings > 1 ? "s" : ""}` : "No ratings yet"}
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        {totalRatings > 0 && (
          <div className="breakdown-list">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star] ?? 0;
              const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              return (
                <div key={star} className="breakdown-row">
                  <span className="breakdown-label">{star}★</span>
                  <div className="breakdown-bar-track">
                    <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="breakdown-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Ratings ── */}
      <div className="ratings-section">
        <p className="rep-section-title">Recent Ratings</p>
        {ratings.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No ratings yet.</p>
        ) : (
          ratings.slice(0, 5).map((r) => (
            <div key={r.id} className="rating-item">
              {r.rater?.avatar_url
                ? <img src={r.rater.avatar_url} alt={r.rater.username} className="rating-item-avatar" />
                : <span className="rating-item-avatar-initials">{(r.rater?.username ?? "U")[0].toUpperCase()}</span>
              }
              <div className="rating-item-body">
                <div className="rating-item-top">
                  <span className="rating-item-user">@{r.rater?.username ?? "Unknown"}</span>
                  <span className="rating-item-date">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <StarRating value={r.score} readonly size="sm" />
                {r.comment && <p className="rating-item-comment">&ldquo;{r.comment}&rdquo;</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Active Posts ── */}
      <div className="reputation-section">
        <p className="rep-section-title">Active Posts</p>
        {posts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No active posts.</p>
        ) : (
          <div className="post-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={post.user_id === currentUser?.id}
                onClaim={() => navigate(post.type === "request" || post.type === "offer" ? `/exchange/${post.id}` : `/posts/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {ratingModal && (
        <RatingModal
          isOpen
          postId={ratingModal.postId}
          postTitle={ratingModal.postTitle}
          ratedUserId={ratingModal.ratedUserId}
          ratedUsername={ratingModal.ratedUsername}
          onClose={() => setRatingModal(null)}
          onSubmitted={() => {
            setRatingModal(null);
            showToast("Rating submitted! Thank you. ⭐");
            refetchPending();
          }}
        />
      )}
    </main>
  );
}
