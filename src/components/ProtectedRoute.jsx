import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Protects a route behind authentication.
 * If requireProfile=true (default), also redirects to /complete-profile
 * when the user has not completed their profile.
 */
export default function ProtectedRoute({ children, requireProfile = true }) {
  const { session, loading } = useAuth();
  const [profileComplete, setProfileComplete] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setProfileLoading(false);
      return;
    }

    if (!requireProfile) {
      setProfileLoading(false);
      return;
    }

    supabase
      .from("users")
      .select("profile_complete")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProfileComplete(false);
        } else {
          setProfileComplete(data.profile_complete);
        }
        setProfileLoading(false);
      });
  }, [session, requireProfile]);

  if (loading || profileLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && profileComplete === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
}
