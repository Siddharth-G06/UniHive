import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, Trash2, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { useToast } from "../components/ToastProvider";
import { createInterestAndConversation, deletePostWithImages } from "../lib/postHelpers";
import { LOSTFOUND_CATEGORIES } from "../constants/categories";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import "../styles/posts.css";

export default function LostFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    if (!user) {
      navigate("/login");
      return;
    }
    const result = await createInterestAndConversation(post.id, post.user_id, user.id);
    if (result?.error === "already_exists") {
      showToast("You have already expressed interest in this post.", "info");
    } else if (result?.error) {
      showToast("Something went wrong: " + result.error, "error");
    } else {
      showToast("Interest sent! Check your messages.", "success");
      refetch();
    }
  }, [user, navigate, refetch, showToast]);

  return (
    <main style={{ flex: 1, background: "var(--background)" }} id="lost-found-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <HelpCircle size={28} color="var(--primary)" /> Lost &amp; Found
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 4 }}>
              Report lost items or help reunite found items with their owners
            </p>
          </div>
          <button
            id="create-lost-found-btn"
            className="btn btn-primary"
            onClick={() => navigate("/create-post?mode=lost-found")}
          >
            <Plus size={18} /> Post an Item
          </button>
        </div>

        {/* Filter bar */}
        <div className="filter-bar-wrap">
          <div className="filter-toggles">
            {[
              { key: "all", label: "All Items" },
              { key: "lost", label: "Lost Items" },
              { key: "found", label: "Found Items" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-toggle ${typeFilter === key ? "active" : ""}`}
                onClick={() => setTypeFilter(key)}
              >
                {label}
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
            {LOSTFOUND_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="search-input-wrap">
            <Search size={16} />
            <input
              className="search-input"
              type="search"
              placeholder="Search by title, color, item..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search posts"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              className="filter-clear-btn"
              onClick={() => {
                setTypeFilter("all");
                setCategory("");
                setSearchInput("");
              }}
            >
              <X size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="form-error" role="alert" style={{ marginBottom: 20 }}>
            Failed to load posts: {error}. Please refresh the page.
          </div>
        )}

        {/* Grid */}
        {loading && posts.length === 0 ? (
          <div className="post-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon-wrap">
                  <Search size={36} strokeWidth={1.75} />
                </div>
                <p className="empty-state-title">No items found</p>
                <p className="empty-state-desc">
                  {activeFilterCount > 0
                    ? "Try adjusting your search terms or filters."
                    : "No active lost or found items right now. Be the first to report one!"}
                </p>
                {activeFilterCount === 0 && (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 20 }}
                    onClick={() => navigate("/create-post?mode=lost-found")}
                  >
                    <Plus size={16} /> Post an Item
                  </button>
                )}
              </div>
            ) : (
              <div className="post-grid">
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
                <button className="btn btn-outline" onClick={loadMore}>
                  Load More Items
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            refetch();
            showToast("Post deleted successfully.", "success");
          }}
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
    if (!error) {
      onDeleted();
    } else {
      setDeleting(false);
    }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Delete this post?</h2>
        <p className="modal-desc">
          &ldquo;{post.title}&rdquo; will be permanently removed. This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={deleting}>
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
  );
}
