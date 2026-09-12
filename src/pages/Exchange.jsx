import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Search, X, Trash2, HandHelping, Share2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { useToast } from "../components/ToastProvider";
import { deletePostWithImages } from "../lib/postHelpers";
import { EXCHANGE_CATEGORIES } from "../constants/categories";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import "../styles/posts.css";

export default function Exchange() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
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

  const handleClaim = useCallback(async (post) => {
    navigate(`/exchange/${post.id}`);
  }, [navigate]);

  async function handleDelete() {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    const { error: delErr } = await deletePostWithImages(deleteTarget.id, user.id, deleteTarget.images || []);
    setDeleting(false);
    if (!delErr) {
      setDeleteTarget(null);
      refetch();
      showToast("Post deleted successfully.", "success");
    } else {
      showToast("Failed to delete post: " + delErr, "error");
    }
  }

  return (
    <main style={{ flex: 1, background: "var(--background)" }} id="exchange-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <ArrowLeftRight size={28} color="#06b6d4" /> Peer Exchange
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 4 }}>
              Borrow study materials, calculators, cycles, and lab equipment from campus peers
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              id="create-request-btn"
              className="btn btn-outline"
              onClick={() => navigate("/create-post?mode=exchange&type=request")}
            >
              <HandHelping size={16} /> Request Item
            </button>
            <button
              id="create-offer-btn"
              className="btn btn-primary"
              onClick={() => navigate("/create-post?mode=exchange&type=offer")}
            >
              <Share2 size={16} /> Offer Item
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar-wrap">
          <div className="filter-toggles">
            {[
              { key: "all",     label: "All Exchanges" },
              { key: "request", label: "Needs (Borrow)" },
              { key: "offer",   label: "Offers (Lend)" },
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
            {EXCHANGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="search-input-wrap">
            <Search size={16} />
            <input
              className="search-input"
              type="search"
              placeholder="Search items, books, calculators..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search exchange posts"
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
                  <ArrowLeftRight size={36} strokeWidth={1.75} />
                </div>
                <p className="empty-state-title">No exchange posts yet</p>
                <p className="empty-state-desc">
                  {activeFilterCount > 0
                    ? "Try adjusting your filters or search terms."
                    : "Be the first to offer or request an item for temporary exchange!"}
                </p>
                {activeFilterCount === 0 && (
                  <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate("/create-post?mode=exchange&type=request")}
                    >
                      <HandHelping size={16} /> Request an Item
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate("/create-post?mode=exchange&type=offer")}
                    >
                      <Share2 size={16} /> Offer an Item
                    </button>
                  </div>
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
                  Load More Exchanges
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">
              &ldquo;{deleteTarget.title}&rdquo; will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
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
