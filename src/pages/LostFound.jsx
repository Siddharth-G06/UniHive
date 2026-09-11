import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { createInterestAndConversation, deletePostWithImages } from "../lib/postHelpers";
import PostCard from "../components/PostCard";
import "../styles/posts.css";

const CATEGORIES = [
  "", "ID Card", "Keys", "Wallet", "Phone", "Laptop",
  "Books", "Earphones", "Water Bottle", "Others"
];

export default function LostFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const types = typeFilter === "all" ? ["lost", "found"] : [typeFilter];
  const { posts, loading, error, hasMore, loadMore, refetch } = usePosts({
    types,
    status: "active",
    category: category || undefined,
    search: search || undefined,
  });

  const activeFilterCount = [typeFilter !== "all", !!category, !!search].filter(Boolean).length;

  const handleClaim = useCallback(async (post) => {
    if (!user) return;
    const { error } = await createInterestAndConversation(post.id, post.user_id, user.id);
    if (error === "already_exists") {
      setToast("You''ve already expressed interest in this post.");
    } else if (error) {
      setToast("Something went wrong. Please try again.");
    } else {
      setToast("Interest sent! Check your messages 📬");
      refetch();
    }
    setTimeout(() => setToast(""), 3500);
  }, [user, refetch]);

  return (
    <main style={{ flex: 1, background: "var(--background)" }}>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">🔍 Lost &amp; Found</h1>
          <button
            id="create-lost-found-btn"
            className="btn btn-primary"
            onClick={() => navigate("/create-post?mode=lost-found")}
          >
            + Post an Item
          </button>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="filter-toggles">
            {["all", "lost", "found"].map((t) => (
              <button
                key={t}
                className={`filter-toggle ${typeFilter === t ? "active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map((c) => (
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
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search posts"
            />
          </div>

          {activeFilterCount > 0 && (
            <span className="filter-count-badge" aria-label={`${activeFilterCount} filters active`}>
              {activeFilterCount}
            </span>
          )}
        </div>

        {error && (
          <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
            Feed error: {error} — check DevTools console for details.
          </div>
        )}

        {/* Grid */}
        {loading && posts.length === 0 ? (
          <div className="post-grid">
            {[1,2,3,4].map((i) => <div key={i} className="post-card" style={{ height: 340, opacity: 0.4, animation: "pulse 1.5s ease infinite" }} />)}
          </div>
        ) : (
          <div className="post-grid">
            {posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p className="empty-state-title">No posts found</p>
                <p className="empty-state-desc">Be the first to post a lost or found item!</p>
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

      {/* Toast */}
      {toast && (
        <div className="toast toast-success" role="status">{toast}</div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refetch(); }}
        />
      )}
    </main>
  );
}

function DeleteModal({ post, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const { error } = await deletePostWithImages(post.id, post.user_id, post.images || []);
    if (!error) onDeleted();
    else setDeleting(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Delete this post?</h2>
        <p className="modal-desc">
          &ldquo;{post.title}&rdquo; will be permanently deleted along with its images. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="btn btn-primary" style={{ background: "var(--error)", borderColor: "var(--error)" }} onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
