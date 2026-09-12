import "../styles/chat.css";

function FakeBubble({ isOwn, width = "55%" }) {
  return (
    <div className={`bubble-row ${isOwn ? "bubble-row-own" : "bubble-row-other"}`} aria-hidden="true">
      {!isOwn && <div className="bubble-avatar-slot"><div className="skel-block" style={{ width: 28, height: 28, borderRadius: "50%" }} /></div>}
      <div className="bubble-content">
        <div className="skel-block" style={{ width, height: 38, borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px" }} />
      </div>
    </div>
  );
}

export default function MessageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }} aria-hidden="true">
      <FakeBubble isOwn={false} width="45%" />
      <FakeBubble isOwn={false} width="60%" />
      <FakeBubble isOwn={true}  width="50%" />
      <FakeBubble isOwn={false} width="35%" />
      <FakeBubble isOwn={true}  width="65%" />
      <FakeBubble isOwn={true}  width="40%" />
    </div>
  );
}
