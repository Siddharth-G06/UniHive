import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { createInterestAndConversation, deletePostWithImages } from "../lib/postHelpers";
import { EXCHANGE_CATEGORIES } from "../constants/categories";
import PostCard from "../components/PostCard";
import "../styles/posts.css";

export default function Exchange() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const types = typeFilter === "all" ? ["request", "offer"] : [typeFilter];
  const { posts, loading, error, hasMore, loadMore, refetch } = usePosts({
    types,
    status: "active",
    category: category || undefined,
    search: search || undefined,
  });

  const activeFilterCount = [typeFilter !== "all", !!category, !!search].filter(Boolean).length;

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  const handleClaim = useCallback(async (post) => {
    if (!user) return;
    navigate(`/exchange/${post.id}`);
  }, [user, navigate]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: delErr } = await deletePostWithImages(deleteTarget.id, user.id, deleteTarget.images || []);
    setDeleting(false);
    if (!delErr) { setDeleteTarget(null); refetch(); showToast("Post deleted."); }
  }

  return (
    <main style={{ flex: 1, background: "var(--background)" }} id="exchange-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🔄 Peer Exchange</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 2 }}>
              Borrow and lend items with fellow students
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              id="create-request-btn"
              className="btn btn-outline"
              onClick={() => navigate("/create-post?mode=exchange&type=request")}
            >
              🙏 Request an Item
            </button>
            <button
              id="create-offer-btn"
              className="btn btn-primary"
              onClick={() => navigate("/create-post?mode=exchange&type=offer")}
            >
              🤝 Offer an Item
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="filter-toggles">
            {[
              { key: "all",     label: "All" },
              { key: "request", label: "🙏 Need" },
              { key: "offer",   label: "🤝 Have" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-toggle ${typeFilter === key ? "active" : ""}`}
                onClick={() => setTypeFilter(key)}
              >{label}</button>
            ))}
          </div>

          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {EXCHANGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="search-input"
              type="search"
              placeholder="Search exchange items..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
        </div>

        {error && (
          <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
            Feed error: {error}
          </div>
        )}

        {/* Grid */}
        {loading && posts.length === 0 ? (
          <div className="post-grid">
            {[1,2,3,4].map((i) => (
              <div key={i} className="post-card" style={{ height: 340, opacity: 0.3 }} />
            ))}
          </div>
        ) : (
          <div className="post-grid">
            {posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔄</div>
                <p className="empty-state-title">No exchange posts yet</p>
                <p className="empty-state-desc">Be the first to offer or request an item!</p>
              </div>
            )}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={post.user_id === user?.id}
                onClaim={handleClaim}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="load-more-wrap">
            <button className="btn btn-outline" onClick={loadMore}>Load More</button>
          </div>
        )}
      </div>

      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">&ldquo;{deleteTarget.title}&rdquo; will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
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
