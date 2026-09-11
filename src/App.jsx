import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import LoadingSpinner from "./components/LoadingSpinner";

/** Root redirect: /dashboard if logged in, /login otherwise */
function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

/** Inner app — lives inside both AuthProvider AND BrowserRouter */
function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Root: smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — requires auth + completed profile */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* My Posts — placeholder (Module 3) */}
        <Route
          path="/my-posts"
          element={
            <ProtectedRoute requireProfileComplete={true}>
              <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font)" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>My Posts</h2>
                <p>Coming in Module 3 🚀</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Complete profile — no profile_complete check to avoid redirect loop */}
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute requireProfileComplete={false}>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
