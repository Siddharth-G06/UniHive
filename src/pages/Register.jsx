import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase, isCollegeEmail } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import BrandLogo from "../components/BrandLogo";
import "../styles/auth.css";

export default function Register() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingSpinner fullScreen />;
  if (session) return <Navigate to="/dashboard" replace />;

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // --- Client-side validation ---
    if (!isCollegeEmail(email)) {
      setError(
        "Only SSN and SNUC college emails are allowed (@ssn.edu.in or @snuchennai.edu.in)"
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Check your college email for a confirmation link to activate your account!"
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
    setSubmitting(false);
  }

  return (
    <main className="auth-page" id="register-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-wrap" style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <BrandLogo size={44} />
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Available for SSN &amp; SNUC students only
          </p>
        </div>

        <form id="register-form" onSubmit={handleRegister} noValidate>
          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              College Email
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="you@ssn.edu.in or you@snuchennai.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password" className="form-label">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password" className="form-label">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="form-error" role="alert" id="register-error">
              {error}
            </div>
          )}

          {success && (
            <div className="form-success" role="status" id="register-success">
              {success}
            </div>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" id="go-to-login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
