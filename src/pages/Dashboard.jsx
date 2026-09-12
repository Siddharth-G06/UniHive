import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import PostCard from "../components/PostCard";
import "../styles/dashboard.css";
import "../styles/posts.css";

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${time}, ${name}! 👋`;
}

const QUICK_ACTIONS = [
  { id: "qa-report-lost",    to: "/create-post?mode=lost-found&type=lost",    icon: "😔", label: "Report Lost Item",   color: "#ef4444" },
  { id: "qa-report-found",   to: "/create-post?mode=lost-found&type=found",   icon: "🎉", label: "Report Found Item",  color: "#16a34a" },
  { id: "qa-request-borrow", to: "/create-post?mode=exchange&type=request",   icon: "🙏", label: "Request to Borrow",  color: "#7c3aed" },
  { id: "qa-offer-lend",     to: "/create-post?mode=exchange&type=offer",     icon: "🤝", label: "Offer to Lend",      color: "#d97706" },
  { id: "qa-browse-lf",      to: "/lost-found",                                icon: "🔍", label: "Browse Lost & Found", color: "#2563eb" },
  { id: "qa-browse-ex",      to: "/exchange",                                  icon: "🔄", label: "Browse Exchange",    color: "#0891b2" },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.username || user?.email?.split("@")[0] || "Student";

  const [stats, setStats] = useState({ lost: 0, found: 0, exchange: 0, myActive: 0 });
  const [recentLF, setRecentLF] = useState([]);
  const [recentEx, setRecentEx] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoadingStats(true);
      const [lostRes, foundRes, exRes, myRes, lfPostsRes, exPostsRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("type", "lost").eq("status", "active"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("type", "found").eq("status", "active"),
        supabase.from("posts").select("id", { count: "exact", head: true }).in("type", ["request", "offer"]).eq("status", "active"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user?.id).eq("status", "active"),
        supabase.from("posts")
          .select("*, users!user_id (username, avatar_url, reputation_score, college)")
          .in("type", ["lost", "found"]).eq("status", "active")
          .order("created_at", { ascending: false }).limit(3),
        supabase.from("posts")
          .select("*, users!user_id (username, avatar_url, reputation_score, college)")
          .in("type", ["request", "offer"]).eq("status", "active")
          .order("created_at", { ascending: false }).limit(3),
      ]);

      setStats({
        lost:     lostRes.count ?? 0,
        found:    foundRes.count ?? 0,
        exchange: exRes.count ?? 0,
        myActive: myRes.count ?? 0,
      });
      setRecentLF(lfPostsRes.data ?? []);
      setRecentEx(exPostsRes.data ?? []);
      setLoadingStats(false);
    }
    if (user?.id) fetchAll();
  }, [user?.id]);

  const STAT_CARDS = [
    { icon: "😔", label: "Active Lost Items",         value: stats.lost,     color: "#ef4444", bg: "#fee2e2" },
    { icon: "🎉", label: "Active Found Items",         value: stats.found,    color: "#16a34a", bg: "#dcfce7" },
    { icon: "🔄", label: "Items Available to Borrow", value: stats.exchange,  color: "#7c3aed", bg: "#ede9fe" },
    { icon: "📌", label: "Your Active Posts",          value: stats.myActive, color: "#2563eb", bg: "#dbeafe" },
  ];

  return (
    <main className="dashboard-page" id="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-content">
          {/* Greeting */}
          <h1 className="dashboard-heading" style={{ fontSize: "1.8rem", marginBottom: 6 }}>
            {greeting(displayName)}
          </h1>
          <p className="dashboard-subheading" style={{ marginBottom: 32 }}>
            Here&apos;s what&apos;s happening on your campus today.
          </p>

          {/* Stats row */}
          <div className="stats-row">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="stat-card" style={{ "--stat-color": s.color, "--stat-bg": s.bg }}>
                <span className="stat-card-icon">{s.icon}</span>
                <span className="stat-card-value">
                  {loadingStats ? <span className="stat-skeleton" /> : s.value}
                </span>
                <span className="stat-card-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <section className="dash-section">
            <h2 className="dash-section-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((qa) => (
                <Link key={qa.id} id={qa.id} to={qa.to} className="quick-action-card">
                  <span className="qa-icon" style={{ background: qa.color + "22", color: qa.color }}>
                    {qa.icon}
                  </span>
                  <span className="qa-label">{qa.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Lost & Found */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Lost &amp; Found</h2>
              <Link to="/lost-found" className="dash-section-link">View all →</Link>
            </div>
            {loadingStats ? (
              <div className="post-grid">
                {[1,2,3].map((i) => <div key={i} className="post-card" style={{ height: 280, opacity: 0.3 }} />)}
              </div>
            ) : recentLF.length === 0 ? (
              <p className="dash-empty">No active posts yet. <Link to="/create-post?mode=lost-found" style={{ color: "rgba(255,255,255,.7)" }}>Be the first!</Link></p>
            ) : (
              <div className="post-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {recentLF.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={post.user_id === user?.id}
                    onClaim={() => navigate(`/posts/${post.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent Exchange */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent Exchange</h2>
              <Link to="/exchange" className="dash-section-link">View all →</Link>
            </div>
            {loadingStats ? (
              <div className="post-grid">
                {[1,2,3].map((i) => <div key={i} className="post-card" style={{ height: 280, opacity: 0.3 }} />)}
              </div>
            ) : recentEx.length === 0 ? (
              <p className="dash-empty">No exchange posts yet. <Link to="/create-post?mode=exchange" style={{ color: "rgba(255,255,255,.7)" }}>Start one!</Link></p>
            ) : (
              <div className="post-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {recentEx.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={post.user_id === user?.id}
                    onClaim={() => navigate(`/exchange/${post.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
