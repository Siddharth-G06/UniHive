import "../styles/posts.css";

export default function PostCardSkeleton() {
  return (
    <div className="post-card post-card-skeleton" aria-hidden="true">
      <div className="post-card-image skel-block" style={{ height: 200 }} />
      <div className="post-card-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div className="skel-block skel-pill" style={{ width: 60, height: 20 }} />
          <div className="skel-block skel-pill" style={{ width: 80, height: 20 }} />
        </div>
        <div className="skel-block" style={{ height: 18, width: "75%", marginBottom: 8 }} />
        <div className="skel-block" style={{ height: 14, width: "100%", marginBottom: 4 }} />
        <div className="skel-block" style={{ height: 14, width: "60%", marginBottom: 12 }} />
        <div className="post-card-footer">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="skel-block" style={{ width: 28, height: 28, borderRadius: "50%" }} />
            <div className="skel-block" style={{ width: 70, height: 13 }} />
          </div>
          <div className="skel-block skel-pill" style={{ width: 56, height: 28 }} />
        </div>
      </div>
    </div>
  );
}
