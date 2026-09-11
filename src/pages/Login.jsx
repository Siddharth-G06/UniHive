import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/auth.css";

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  if (loading) return <LoadingSpinner fullScreen />;
  if (session) return <Navigate to="/dashboard" replace />;

  async function handleMicrosoftLogin() {
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile",
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
    // On success, browser redirects — no navigate() needed
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <main className="auth-page" id="login-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <span className="auth-logo-icon" aria-hidden="true">🐝</span>
          <h1 className="auth-title">Welcome to UniHive</h1>
          <p className="auth-subtitle">Your campus marketplace for SSN &amp; SNUC students</p>
        </div>

        {/* Microsoft OAuth */}
        <button
          id="microsoft-login-btn"
          className="btn btn-microsoft"
          onClick={handleMicrosoftLogin}
          disabled={submitting}
          type="button"
        >
          <MicrosoftIcon />
          <span>Continue with Microsoft</span>
        </button>

        {/* Divider */}
        <div className="auth-divider" role="separator">
          <span>or</span>
        </div>

        {/* Email / Password Form */}
        <form id="login-form" onSubmit={handleEmailLogin} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">College Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@ssn.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="form-error" role="alert" id="login-error">
              {error}
            </div>
          )}

          <button
            id="email-login-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register" id="go-to-register" className="auth-link">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
