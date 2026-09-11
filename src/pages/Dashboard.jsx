import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";
import "../styles/posts.css";

const NAV_CARDS = [
  {
    to: "/lost-found",
    icon: "🔍",
    title: "Lost & Found",
    desc: "Report lost items or help return found ones",
  },
  {
    to: "/create-post?mode=lost-found",
    icon: "📝",
    title: "Post an Item",
    desc: "Lost something? Found something? Post it now",
  },
  {
    to: "/my-posts",
    icon: "📌",
    title: "My Posts",
    desc: "View and manage all your posts",
  },
  {
    to: "/profile",
    icon: "👤",
    title: "My Profile",
    desc: "Update your profile and settings",
  },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const displayName = profile?.username || user?.email?.split("@")[0] || "Student";

  return (
    <main className="dashboard-page" id="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-content">
          <div className="dashboard-badge">
            <span>🐝</span> UniHive Campus Platform
          </div>
          <h1 className="dashboard-heading">
            Welcome back, <span className="highlight">{displayName}</span>!
          </h1>
          <p className="dashboard-subheading">
            Your campus hub for Lost &amp; Found, Peer Exchange, and more.
          </p>

          {/* Navigation cards */}
          <div className="dash-nav-cards">
            {NAV_CARDS.map((card) => (
              <Link key={card.to} to={card.to} className="dash-nav-card" id={`dash-nav-${card.title.toLowerCase().replace(/\s+/g,"-")}`}>
                <span className="dash-nav-icon">{card.icon}</span>
                <span className="dash-nav-title">{card.title}</span>
                <span className="dash-nav-desc">{card.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
