import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <main className="dashboard-page" id="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-content">
          <div className="dashboard-badge">
            <span>🐝</span> Module 1 — Foundation
          </div>
          <h1 className="dashboard-heading">
            Welcome to UniHive, <span className="highlight">{displayName}</span>!
          </h1>
          <p className="dashboard-subheading">
            Your campus Lost &amp; Found and Peer Exchange hub is almost ready.
            More features are coming in Module 3.
          </p>

          <div className="dashboard-info-card">
            <div className="info-row">
              <span className="info-label">Signed in as</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID</span>
              <span className="info-value mono">{user?.id?.slice(0, 8)}…</span>
            </div>
          </div>

          <button
            id="dashboard-sign-out-btn"
            className="btn btn-outline-dark"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
