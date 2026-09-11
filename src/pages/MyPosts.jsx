import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { deletePostWithImages } from "../lib/postHelpers";
import { supabase } from "../lib/supabase";
import PostCard from "../components/PostCard";
import "../styles/posts.css";

const TABS = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "claimed",  label: "Claimed" },
  { key: "resolved", label: "Resolved" },
];

export default function MyPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  const { posts, loading, hasMore, loadMore, refetch } = usePosts({
    userId: user?.id,
    status: activeTab === "all" ? undefined : activeTab,
    types: ["lost", "found", "request", "offer"],
  });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleQuickResolve(post) {
    await supabase.from("posts").update({ status: "resolved" }).eq("id", post.id);
    refetch();
    showToast("Marked as resolved ✅");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deletePostWithImages(deleteTarget.id, user.id, deleteTarget.images || []);
    setDeleting(false);
    if (!error) {
      setDeleteTarget(null);
      refetch();
      showToast("Post deleted.");
    }
  }

  return (
    <main style={{ flex: 1, background: "var(--background)" }}>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">📌 My Posts</h1>
          <button className="btn btn-primary" onClick={() => navigate("/create-post?mode=lost-found")}>
            + New Post
          </button>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              id={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && posts.length === 0 ? (
          <div className="post-grid">
            {[1,2].map((i) => <div key={i} className="post-card" style={{ height: 300, opacity: 0.4 }} />)}
          </div>
        ) : (
          <div className="post-grid">
            {posts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-title">No {activeTab === "all" ? "" : activeTab} posts yet</p>
                <p className="empty-state-desc">
                  {activeTab === "all"
                    ? "Post your first lost or found item to get started!"
                    : `You have no ${activeTab} posts.`}
                </p>
              </div>
            )}

            {posts.map((post) => (
              <div key={post.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PostCard
                  post={post}
                  isOwner={true}
                  onDelete={setDeleteTarget}
                />
                {post.status === "active" && (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    onClick={() => handleQuickResolve(post)}
                  >
                    ✅ Mark as Resolved
                  </button>
                )}
              </div>
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
      {toast && <div className="toast toast-success" role="status">{toast}</div>}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete this post?</h2>
            <p className="modal-desc">
              &ldquo;{deleteTarget.title}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
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
