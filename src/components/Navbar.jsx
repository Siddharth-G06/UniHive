import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/navbar.css";
import "../styles/profile.css";

function getInitials(name, email) {
  const src = name || email || "U";
  return src.charAt(0).toUpperCase();
}

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.username || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || null;
  const initials = getInitials(profile?.username, user?.email);

  async function handleSignOut() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Close dropdown when clicking outside
  function handleBlur(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
      setDropdownOpen(false);
    }
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" aria-label="UniHive home">
          <span className="logo-icon" aria-hidden="true">🐝</span>
          <span className="logo-text">UniHive</span>
        </Link>

        {/* Right side */}
        <div className="navbar-actions">
          {user ? (
            <div
              className="navbar-user-menu"
              ref={dropdownRef}
              onBlur={handleBlur}
            >
              <button
                id="navbar-user-btn"
                className="navbar-avatar-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="navbar-avatar"
                  />
                ) : (
                  <span className="navbar-avatar navbar-avatar-initials">
                    {initials}
                  </span>
                )}
                <span className="navbar-username">{displayName}</span>
                <svg
                  className={`navbar-caret ${dropdownOpen ? "open" : ""}`}
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown" role="menu">
                  <Link
                    to="/profile"
                    id="nav-my-profile"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <Link
                    to="/my-posts"
                    id="nav-my-posts"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="dropdown-icon">📌</span>
                    My Posts
                    <span className="dropdown-badge">Soon</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    id="nav-sign-out"
                    className="dropdown-item dropdown-item-danger"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
