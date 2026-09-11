import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const displayName =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Logo / Wordmark */}
        <Link to="/" className="navbar-logo" aria-label="UniHive home">
          <span className="logo-icon" aria-hidden="true">🐝</span>
          <span className="logo-text">UniHive</span>
        </Link>

        {/* Right side */}
        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-username" title={user.email}>
                {displayName}
              </span>
              <button
                id="sign-out-btn"
                className="btn btn-outline"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" id="login-nav-btn" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
