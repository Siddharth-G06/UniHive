import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";
import LoadingSpinner from "./components/LoadingSpinner";

/** Root redirect: /dashboard if logged in, /login otherwise */
function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

/** Inner app that lives inside both AuthProvider AND BrowserRouter */
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

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireProfile={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Complete profile — protected but NO profile_complete check to avoid redirect loop */}
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute requireProfile={false}>
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

