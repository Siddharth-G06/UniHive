import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Protects a route behind authentication.
 * Uses profile from AuthContext — no extra Supabase query.
 *
 * requireProfileComplete (default true):
 *   - true  → redirect to /complete-profile if profile_complete is false
 *   - false → skip profile_complete check (used by /complete-profile itself)
 */
export default function ProtectedRoute({ children, requireProfileComplete = true }) {
  const { session, loading, profile } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  // Not authenticated → send to login
  if (!session) return <Navigate to="/login" replace />;

  // Profile check — only when requireProfileComplete=true
  if (requireProfileComplete && profile !== null && profile?.profile_complete === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  // If profile_complete is true and user tries to visit /complete-profile,
  // redirect to dashboard (handled in CompleteProfile itself for clarity)

  return children;
}
