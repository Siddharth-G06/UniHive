import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  CheckCircle2,
  ArrowLeftRight,
  Pin,
  Search,
  PlusCircle,
  HandHelping,
  Share2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import PostCard from "../components/PostCard";
import "../styles/dashboard.css";
import "../styles/posts.css";

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${time}, ${name}!`;
}

const QUICK_ACTIONS = [
  {
    id: "qa-report-lost",
    to: "/create-post?mode=lost-found&type=lost",
    Icon: HelpCircle,
    label: "Report Lost Item",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
  {
    id: "qa-report-found",
    to: "/create-post?mode=lost-found&type=found",
    Icon: CheckCircle2,
    label: "Report Found Item",
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.15)",
  },
  {
    id: "qa-request-borrow",
    to: "/create-post?mode=exchange&type=request",
    Icon: HandHelping,
    label: "Request to Borrow",
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.15)",
  },
  {
    id: "qa-offer-lend",
    to: "/create-post?mode=exchange&type=offer",
    Icon: Share2,
    label: "Offer to Lend",
    color: "#d97706",
    bg: "rgba(217, 119, 6, 0.15)",
  },
  {
    id: "qa-browse-lf",
    to: "/lost-found",
    Icon: Search,
    label: "Browse Lost & Found",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
  },
  {
    id: "qa-browse-ex",
    to: "/exchange",
    Icon: ArrowLeftRight,
    label: "Browse Peer Exchange",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
  },
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
    {
      Icon: HelpCircle,
      label: "Active Lost Items",
      value: stats.lost,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.2)",
    },
    {
      Icon: CheckCircle2,
      label: "Active Found Items",
      value: stats.found,
      color: "#16a34a",
      bg: "rgba(22, 163, 74, 0.2)",
    },
    {
      Icon: ArrowLeftRight,
      label: "Items to Borrow / Lend",
      value: stats.exchange,
      color: "#a855f7",
      bg: "rgba(168, 85, 247, 0.2)",
    },
    {
      Icon: Pin,
      label: "Your Active Posts",
      value: stats.myActive,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.2)",
    },
  ];

  return (
    <main className="dashboard-page" id="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-content">

          {/* Top greeting banner */}
          <div className="dashboard-topbar">
            <div>
              <h1 className="dashboard-heading">
                {greeting(displayName)}
              </h1>
              <p className="dashboard-subheading">
                Here is what is happening on your campus today.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn btn-outline"
                style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)" }}
                onClick={() => navigate("/lost-found")}
              >
                <Search size={16} /> Lost &amp; Found
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/create-post")}
              >
                <PlusCircle size={16} /> Create Post
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-row">
            {STAT_CARDS.map((s) => {
              const IconComp = s.Icon;
              return (
                <div key={s.label} className="stat-card" style={{ "--stat-color": s.color, "--stat-bg": s.bg }}>
                  <div className="stat-card-icon">
                    <IconComp size={26} strokeWidth={2.2} />
                  </div>
                  <div className="stat-card-info">
                    <span className="stat-card-value">
                      {loadingStats ? <span className="stat-skeleton" /> : s.value}
                    </span>
                    <span className="stat-card-label">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">
                <Sparkles size={20} color="#60a5fa" /> Quick Actions
              </h2>
            </div>
            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((qa) => {
                const IconComp = qa.Icon;
                return (
                  <Link key={qa.id} id={qa.id} to={qa.to} className="quick-action-card">
                    <span className="qa-icon" style={{ background: qa.bg, color: qa.color }}>
                      <IconComp size={24} strokeWidth={2.2} />
                    </span>
                    <span className="qa-label">{qa.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Lost & Found */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">
                <Search size={20} color="#ef4444" /> Recent Lost &amp; Found
              </h2>
              <Link to="/lost-found" className="dash-section-link">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            {loadingStats ? (
              <div className="post-grid">
                {[1,2,3].map((i) => <div key={i} className="post-card" style={{ height: 280, opacity: 0.3 }} />)}
              </div>
            ) : recentLF.length === 0 ? (
              <p className="dash-empty">
                No active posts yet.{" "}
                <Link to="/create-post?mode=lost-found" style={{ color: "#93c5fd", fontWeight: 700 }}>
                  Be the first to post!
                </Link>
              </p>
            ) : (
              <div className="post-grid">
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

          {/* Recent Peer Exchange */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">
                <ArrowLeftRight size={20} color="#06b6d4" /> Recent Peer Exchange
              </h2>
              <Link to="/exchange" className="dash-section-link">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            {loadingStats ? (
              <div className="post-grid">
                {[1,2,3].map((i) => <div key={i} className="post-card" style={{ height: 280, opacity: 0.3 }} />)}
              </div>
            ) : recentEx.length === 0 ? (
              <p className="dash-empty">
                No exchange posts yet.{" "}
                <Link to="/create-post?mode=exchange" style={{ color: "#93c5fd", fontWeight: 700 }}>
                  Start an exchange request or offer!
                </Link>
              </p>
            ) : (
              <div className="post-grid">
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
