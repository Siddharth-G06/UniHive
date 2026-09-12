import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  ArrowLeftRight,
  MessageSquare,
  User,
  Pin,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { useUnreadCount } from "../hooks/useUnreadCount";
import BrandLogo from "./BrandLogo";
import "../styles/navbar.css";
import "../styles/profile.css";
import "../styles/chat.css";

function getInitials(name, email) {
  const src = name || email || "U";
  return src.charAt(0).toUpperCase();
}

export default function Navbar() {
  const { user, profile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.username || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || null;
  const initials = getInitials(profile?.username, user?.email);
  const totalUnread = useUnreadCount(user?.id ?? null);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    setMobileOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" aria-label="UniHive home">
          <BrandLogo size={28} />
          <span className="logo-text">UniHive</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div className="navbar-links navbar-desktop">
            <Link to="/lost-found" className="nav-link" id="nav-lost-found-link">
              <Search size={16} /> Lost &amp; Found
            </Link>
            <Link to="/exchange" className="nav-link" id="nav-exchange-link">
              <ArrowLeftRight size={16} /> Peer Exchange
            </Link>
          </div>
        )}

        {/* Desktop right side */}
        <div className="navbar-actions navbar-desktop">
          {/* Theme toggle button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} className="theme-icon-sun" /> : <Moon size={18} className="theme-icon-moon" />}
          </button>

          {user ? (
            <>
              <Link
                to="/create-post"
                id="nav-create-post-btn"
                className="btn btn-primary"
                style={{ padding: "7px 14px", fontSize: "0.85rem" }}
              >
                <PlusCircle size={15} /> Create Post
              </Link>

              <Link
                to="/messages"
                id="nav-messages-link"
                className="nav-messages-link"
                aria-label={`Messages${totalUnread > 0 ? `, ${totalUnread} unread` : ""}`}
              >
                <MessageSquare size={17} />
                <span>Messages</span>
                {totalUnread > 0 && (
                  <span className="nav-messages-badge" aria-hidden="true">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>

              <div className="navbar-user-menu" ref={dropdownRef}>
                <button
                  id="navbar-user-btn"
                  type="button"
                  className="navbar-avatar-btn"
                  onClick={() => setDropdownOpen((p) => !p)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="navbar-avatar" />
                  ) : (
                    <span className="navbar-avatar navbar-avatar-initials">{initials}</span>
                  )}
                  <span className="navbar-username">{displayName}</span>
                  <ChevronDown
                    size={14}
                    className={`navbar-caret ${dropdownOpen ? "open" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <Link to="/dashboard" id="nav-dashboard" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                      <span className="dropdown-icon"><Home size={15} /></span> Dashboard
                    </Link>
                    <Link to="/profile" id="nav-my-profile" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                      <span className="dropdown-icon"><User size={15} /></span> My Profile
                    </Link>
                    <Link to="/my-posts" id="nav-my-posts" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                      <span className="dropdown-icon"><Pin size={15} /></span> My Posts
                    </Link>
                    <Link to="/messages" id="nav-messages" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                      <span className="dropdown-icon"><MessageSquare size={15} /></span>
                      Messages
                      {totalUnread > 0 && (
                        <span className="dropdown-badge" style={{ background: "var(--primary-light)", color: "var(--primary)", borderColor: "var(--border)" }}>
                          {totalUnread}
                        </span>
                      )}
                    </Link>
                    <div className="dropdown-divider" />
                    <button type="button" className="dropdown-item" onClick={toggleTheme} role="menuitem">
                      <span className="dropdown-icon">{isDark ? <Sun size={15} /> : <Moon size={15} />}</span>
                      {isDark ? "Light Mode" : "Dark Mode"}
                    </button>
                    <div className="dropdown-divider" />
                    <button id="nav-sign-out" className="dropdown-item dropdown-item-danger" role="menuitem" onClick={handleSignOut}>
                      <span className="dropdown-icon"><LogOut size={15} /></span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" id="login-nav-btn" className="btn btn-primary">Login</Link>
          )}
        </div>

        {/* Mobile top right: Theme toggle & Hamburger */}
        <div className="navbar-mobile navbar-mobile-controls" style={{ display: "none", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <button
              className="navbar-hamburger"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              {totalUnread > 0 && !mobileOpen && (
                <span className="hamburger-unread-dot" aria-hidden="true" />
              )}
            </button>
          ) : (
            <Link to="/login" id="login-nav-btn-mobile" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && user && (
        <div className="navbar-mobile-menu" role="menu">
          <Link to="/dashboard"   className="mobile-menu-item" role="menuitem"><Home size={18} />   Dashboard</Link>
          <Link to="/lost-found"  className="mobile-menu-item" role="menuitem"><Search size={18} />  Lost &amp; Found</Link>
          <Link to="/exchange"    className="mobile-menu-item" role="menuitem"><ArrowLeftRight size={18} />    Exchange</Link>
          <Link to="/messages"    className="mobile-menu-item" role="menuitem">
            <MessageSquare size={18} /> Messages
            {totalUnread > 0 && <span className="mobile-unread-badge">{totalUnread}</span>}
          </Link>
          <div className="mobile-menu-divider" />
          <Link to="/profile"     className="mobile-menu-item" role="menuitem"><User size={18} />   My Profile</Link>
          <Link to="/my-posts"    className="mobile-menu-item" role="menuitem"><Pin size={18} />    My Posts</Link>
          <Link to="/create-post" className="mobile-menu-item" role="menuitem">
            <PlusCircle size={18} /> Create Post
          </Link>
          <div className="mobile-menu-divider" />
          <button type="button" className="mobile-menu-item" onClick={toggleTheme} role="menuitem">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </button>
          <div className="mobile-menu-divider" />
          <button className="mobile-menu-item mobile-menu-danger" onClick={handleSignOut}><LogOut size={18} /> Sign Out</button>
        </div>
      )}
    </nav>
  );
}
